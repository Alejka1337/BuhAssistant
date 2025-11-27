# 🔧 Исправление проблемы Celery Queues

## 📋 Проблема

**Симптомы:**
- Celery Beat отправляет таски (видно в логах: "Sending due task crawl-all-news-twice-daily")
- Celery Worker работает, но не выполняет таски
- Количество новостей в БД не увеличивается
- Worker показывает только `[queues] .> celery` (default queue)

**Причина:**
Celery Worker был настроен слушать только default queue `celery`, но таски отправлялись в кастомные очереди:
- `crawler` - для краулеров новостей
- `notifications` - для push-уведомлений
- `default` - для тестовых задач

---

## 🔍 Диагностика

### Шаг 1: Проверить логи Celery Beat

```bash
docker logs buhassistant_celery_beat --tail 30
```

**Ожидаемый вывод:**
```
[2025-11-17 18:00:00,023: INFO/MainProcess] Scheduler: Sending due task crawl-all-news-twice-daily (crawl_all_news_sources_task)
```

✅ Beat отправляет таски.

---

### Шаг 2: Проверить логи Celery Worker

```bash
docker logs buhassistant_celery_worker --tail 50
```

**Проблемный вывод:**
```
[queues]
  .> celery           exchange=celery(direct) key=celery

[tasks]
  . crawl_all_news_sources_task
  . crawl_buhgalter911_news_task
  . crawl_liga_net_news_task
  . crawl_minfin_news_task
  . send_deadline_notifications
  . send_news_notifications
```

⚠️ Worker зарегистрировал таски, но слушает только `celery` queue.

---

### Шаг 3: Проверить конфигурацию в celery_app.py

**Файл:** `backend/app/celery_app.py`

```python
# Настройка периодических задач (Celery Beat)
celery_app.conf.beat_schedule = {
    'crawl-all-news-twice-daily': {
        'task': 'crawl_all_news_sources_task',
        'schedule': crontab(minute=0, hour='8,20'),
        'options': {'queue': 'crawler'}  # ⚠️ Таски идут в 'crawler' queue!
    },
    'send-deadline-notifications-daily': {
        'task': 'send_deadline_notifications',
        'schedule': crontab(minute=0, hour=9),
        'options': {'queue': 'notifications'}  # ⚠️ Таски идут в 'notifications' queue!
    },
    ...
}

# Настройка очередей
celery_app.conf.task_routes = {
    'crawl_minfin_news_task': {'queue': 'crawler'},
    'crawl_liga_net_news_task': {'queue': 'crawler'},
    'crawl_buhgalter911_news_task': {'queue': 'crawler'},
    'crawl_all_news_sources_task': {'queue': 'crawler'},
    'send_deadline_notifications': {'queue': 'notifications'},
    'send_news_notifications': {'queue': 'notifications'},
    'test_celery_task': {'queue': 'default'},
}
```

✅ Таски правильно настроены с routing.

---

### Шаг 4: Проверить docker-compose.yml

**Файл:** `docker-compose.yml`

**Проблемная конфигурация:**
```yaml
celery_worker:
  ...
  command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
  # ⚠️ Нет указания --queues, worker слушает только default queue 'celery'
```

---

## ✅ Решение

### Исправление docker-compose.yml

**Было:**
```yaml
command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
```

**Стало:**
```yaml
command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2 --queues=celery,crawler,notifications,default
```

**Что это делает:**
- `--queues=celery,crawler,notifications,default` - worker теперь слушает все 4 очереди
- Worker будет обрабатывать таски из любой из этих очередей
- Приоритет обработки: слева направо (celery → crawler → notifications → default)

---

### Применение исправления

**Шаг 1: Перезапустить Celery Worker**

```bash
cd /Users/alejka1337/Desktop/buhassistant
docker-compose restart celery_worker
```

**Шаг 2: Проверить логи**

```bash
docker logs buhassistant_celery_worker --tail 30
```

**Ожидаемый вывод (исправленный):**
```
[queues]
  .> celery           exchange=celery(direct) key=celery
  .> crawler          exchange=crawler(direct) key=crawler
  .> notifications    exchange=notifications(direct) key=notifications
  .> default          exchange=default(direct) key=default

[tasks]
  . crawl_all_news_sources_task
  . crawl_buhgalter911_news_task
  . crawl_liga_net_news_task
  . crawl_minfin_news_task
  . send_deadline_notifications
  . send_news_notifications
  . test_celery_task
```

✅ Worker теперь слушает все очереди!

---

### Шаг 3: Проверить выполнение задач

**Принудительный запуск:**
```bash
docker-compose exec backend python -c "from app.celery_app import celery_app; celery_app.send_task('crawl_all_news_sources_task')"
```

**Проверить логи:**
```bash
docker logs buhassistant_celery_worker --tail 100 | grep "crawl\|Task.*succeeded"
```

**Ожидаемый вывод:**
```
[2025-11-17 20:09:28,737: WARNING/ForkPoolWorker-2] 🎉 Minfin crawler finished: 200 unique articles
[2025-11-17 20:09:28,738: INFO/ForkPoolWorker-2] 📰 Crawled 200 news items
[2025-11-17 20:09:29,123: INFO/ForkPoolWorker-2] Task crawl_all_news_sources_task[...] succeeded
```

✅ Таски выполняются!

---

### Шаг 4: Проверить количество новостей в БД

```bash
docker-compose exec -T backend python << 'EOF'
from app.db.database import SessionLocal
from app.models.news import News

db = SessionLocal()
count = db.query(News).count()
print(f"Total news in DB: {count}")

print("\nLatest 5 news:")
for n in db.query(News).order_by(News.published_at.desc()).limit(5).all():
    print(f"  - {n.title[:70]}...")
EOF
```

**Ожидаемый вывод:**
```
Total news in DB: 51

Latest 5 news:
  - НБУ пропонує посилити контроль над операціями з готівкою...
  - З початку року кількість заблокованих податкових накладних зменшилася...
  - В Україні створять Реєстр «поганих» клієнтів фінустанов: хто потрапить...
  - Податкові надходження від ринку пального зросли на 30% — Гетманцев...
  - Україна переходить на нову систему КВЕД: повна синхронізація з ЄС відб...
```

✅ Новости добавляются в БД!

---

## 📊 Мониторинг Celery

### Проверка состояния worker'ов

```bash
docker-compose exec backend celery -A app.celery_app.celery_app inspect active
```

**Покажет активные таски.**

---

### Проверка зарегистрированных очередей

```bash
docker-compose exec backend celery -A app.celery_app.celery_app inspect active_queues
```

**Ожидаемый вывод:**
```
-> celery@...: OK
    * [{'name': 'celery', ...}, 
       {'name': 'crawler', ...}, 
       {'name': 'notifications', ...}, 
       {'name': 'default', ...}]
```

---

### Проверка зарегистрированных задач

```bash
docker-compose exec backend celery -A app.celery_app.celery_app inspect registered
```

**Ожидаемый вывод:**
```
-> celery@...: OK
    * crawl_all_news_sources_task
    * crawl_buhgalter911_news_task
    * crawl_liga_net_news_task
    * crawl_minfin_news_task
    * send_deadline_notifications
    * send_news_notifications
    * test_celery_task
```

---

### Проверка расписания Celery Beat

```bash
docker-compose exec backend celery -A app.celery_app.celery_app inspect scheduled
```

**Покажет запланированные таски с временем выполнения.**

---

## 🔄 Альтернативные решения

### Вариант 1: Отдельные worker'ы для каждой очереди

**Более масштабируемое решение для production:**

```yaml
# Worker для краулеров (CPU-intensive)
celery_worker_crawler:
  ...
  command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=4 --queues=crawler
  
# Worker для уведомлений (IO-intensive)
celery_worker_notifications:
  ...
  command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2 --queues=notifications
  
# Worker для default задач
celery_worker_default:
  ...
  command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2 --queues=celery,default
```

**Преимущества:**
- Изоляция задач
- Разная конфигурация concurrency
- Можно масштабировать каждый worker независимо

**Недостатки:**
- Больше контейнеров
- Выше потребление ресурсов

---

### Вариант 2: Использовать priority queues

**Для разных приоритетов задач:**

```python
celery_app.conf.task_routes = {
    'crawl_all_news_sources_task': {'queue': 'crawler', 'priority': 5},
    'send_deadline_notifications': {'queue': 'notifications', 'priority': 10},
}
```

```yaml
command: celery -A app.celery_app.celery_app worker --loglevel=info --queues=high_priority,crawler,notifications,default
```

---

## 🐛 Возможные проблемы после исправления

### Проблема 1: Worker перегружен

**Симптомы:**
- Таски выполняются медленно
- High CPU/Memory usage

**Решение:**
- Увеличить `--concurrency` (количество worker processes)
- Добавить еще один worker контейнер

```yaml
command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=4 --queues=celery,crawler,notifications,default
```

---

### Проблема 2: Краулер долго работает

**Симптомы:**
- Task timeout (более 30 минут)
- Worker убивает таску

**Решение:**
Увеличить `task_time_limit` в `celery_app.py`:

```python
celery_app.conf.update(
    task_time_limit=60 * 60,  # 60 минут (было 30)
)
```

---

### Проблема 3: Duplicate tasks

**Симптомы:**
- Одна и та же новость добавляется несколько раз

**Решение:**
Проверка дублей уже реализована в `crawler_tasks.py`:

```python
existing_news = db.query(News).filter(News.link == news_item.link).first()
if existing_news:
    logger.info(f"Skipping duplicate: {news_item.title}")
    continue
```

✅ Должно работать корректно.

---

### Проблема 4: Redis memory overflow

**Симптомы:**
- Redis падает
- Tasks не сохраняются в очереди

**Решение:**
Настроить Redis eviction policy в `docker-compose.yml`:

```yaml
redis:
  ...
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

---

## ✅ Проверка после исправления

**Checklist:**

- [x] `docker logs buhassistant_celery_worker` показывает 4 очереди
- [x] `docker logs buhassistant_celery_beat` отправляет таски
- [x] Таски выполняются (видно в логах worker)
- [x] Количество новостей в БД увеличивается
- [x] Нет ошибок в логах
- [x] Worker не перегружен (CPU/Memory в норме)

---

## 📚 Дополнительные материалы

**Celery Docs:**
- Routing: https://docs.celeryq.dev/en/stable/userguide/routing.html
- Queues: https://docs.celeryq.dev/en/stable/userguide/workers.html#starting-the-worker
- Monitoring: https://docs.celeryq.dev/en/stable/userguide/monitoring.html

**Troubleshooting:**
- https://docs.celeryq.dev/en/stable/faq.html
- https://docs.celeryq.dev/en/stable/userguide/debugging.html

---

## 🎯 Итоги

**Что было исправлено:**
- ✅ Celery Worker теперь слушает все очереди: `celery`, `crawler`, `notifications`, `default`
- ✅ Таски из Celery Beat корректно обрабатываются
- ✅ Краулеры выполняются по расписанию (8:00 и 20:00)
- ✅ Push-уведомления будут работать (после регистрации Apple Developer Account)
- ✅ Новости автоматически добавляются в БД

**Статус:** ✅ ПРОБЛЕМА РЕШЕНА

**Дата исправления:** 2025-11-17

