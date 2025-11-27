# Celery Tasks - Автоматический парсинг новостей

## Обзор

Celery используется для выполнения фоновых задач в приложении BuhAssistant. Основная задача - автоматический парсинг новостей с авторитетных источников каждые 2-3 часа.

## Архитектура

### Компоненты

1. **Celery Worker** - выполняет фоновые задачи
2. **Celery Beat** - планировщик периодических задач
3. **Redis** - брокер сообщений и хранилище результатов

### Задачи (Tasks)

#### 1. `crawl_minfin_news_task`

Автоматически парсит новости с minfin.com.ua, фильтрует через OpenAI и сохраняет в БД.

- **Расписание**: Каждые 2 часа (в 00:00, 02:00, 04:00, ...)
- **Очередь**: `crawler`
- **Таймаут**: 30 минут

**Процесс работы**:
1. Парсинг новостей с minfin.com.ua/ua/articles/ и minfin.com.ua/ua/news/
2. Фильтрация через OpenAI API (только релевантные для бухгалтеров)
3. Проверка на дубликаты в БД
4. Сохранение новых новостей

#### 2. `test_celery_task`

Тестовая задача для проверки работы Celery.

- **Расписание**: Каждые 5 минут
- **Очередь**: `default`

## Запуск и управление

### Запуск всех сервисов

```bash
docker-compose up -d
```

### Запуск только Celery worker

```bash
docker-compose up -d celery_worker
```

### Запуск только Celery beat

```bash
docker-compose up -d celery_beat
```

### Просмотр логов

```bash
# Логи worker
docker-compose logs -f celery_worker

# Логи beat (планировщик)
docker-compose logs -f celery_beat

# Все логи Celery
docker-compose logs -f celery_worker celery_beat
```

### Остановка сервисов

```bash
docker-compose stop celery_worker celery_beat
```

## Мониторинг задач

### Flower - Web UI для мониторинга Celery

Можно добавить Flower для визуального мониторинга задач:

```yaml
# В docker-compose.yml
flower:
  build:
    context: ./backend
  container_name: buhassistant_flower
  command: celery -A app.celery_app.celery_app flower --port=5555
  ports:
    - "5555:5555"
  environment:
    - REDIS_URL=redis://redis:6379/0
  depends_on:
    - redis
    - celery_worker
```

После запуска доступен по адресу: http://localhost:5555

### Ручной запуск задач

Можно запустить задачу вручную через Python:

```python
from app.tasks.crawler_tasks import crawl_minfin_news_task

# Синхронный запуск
result = crawl_minfin_news_task()

# Асинхронный запуск через Celery
task = crawl_minfin_news_task.delay()
print(f"Task ID: {task.id}")
print(f"Task status: {task.status}")
print(f"Task result: {task.result}")
```

Или через API endpoint:

```bash
# Ручной запуск краулера
curl -X POST http://localhost:8000/api/news/crawl/minfin
```

## Настройка расписания

Расписание настраивается в `backend/app/celery_app.py`:

```python
celery_app.conf.beat_schedule = {
    'crawl-minfin-news-every-2-hours': {
        'task': 'crawl_minfin_news_task',
        'schedule': crontab(minute=0, hour='*/2'),  # Каждые 2 часа
        'options': {'queue': 'crawler'}
    },
}
```

### Примеры расписаний

```python
from celery.schedules import crontab

# Каждые 3 часа
crontab(minute=0, hour='*/3')

# Каждый день в 08:00
crontab(minute=0, hour=8)

# Каждый понедельник в 09:00
crontab(minute=0, hour=9, day_of_week=1)

# Каждые 30 минут
crontab(minute='*/30')
```

## Добавление новых задач

### 1. Создать функцию задачи

В `backend/app/tasks/crawler_tasks.py`:

```python
@shared_task(name="my_new_task")
def my_new_task():
    """
    Описание задачи
    """
    logger.info("Starting my new task...")
    # Ваш код
    return {"status": "success"}
```

### 2. Добавить в расписание

В `backend/app/celery_app.py`:

```python
celery_app.conf.beat_schedule = {
    'my-new-task-schedule': {
        'task': 'my_new_task',
        'schedule': crontab(minute=0, hour=12),  # Каждый день в 12:00
        'options': {'queue': 'default'}
    },
}
```

### 3. Перезапустить сервисы

```bash
docker-compose restart celery_worker celery_beat
```

## Очереди задач

- **`default`** - обычные задачи
- **`crawler`** - задачи парсинга (могут быть долгими)

## Troubleshooting

### Задачи не выполняются

1. Проверить что Redis запущен:
   ```bash
   docker-compose ps redis
   ```

2. Проверить логи worker:
   ```bash
   docker-compose logs celery_worker
   ```

3. Проверить логи beat:
   ```bash
   docker-compose logs celery_beat
   ```

### Задачи зависают

1. Увеличить таймаут в `celery_app.py`:
   ```python
   task_time_limit=60 * 60  # 1 час
   ```

2. Перезапустить worker:
   ```bash
   docker-compose restart celery_worker
   ```

### Ошибки OpenAI API

1. Проверить что API key установлен:
   ```bash
   docker-compose exec celery_worker env | grep OPENAI_API_KEY
   ```

2. Проверить баланс OpenAI аккаунта

3. Проверить логи на наличие ошибок:
   ```bash
   docker-compose logs celery_worker | grep "OpenAI\|ERROR"
   ```

## Рекомендации по продакшену

1. **Мониторинг**: Использовать Flower или Prometheus для мониторинга
2. **Логирование**: Настроить централизованное логирование (ELK, Sentry)
3. **Алерты**: Настроить уведомления при ошибках
4. **Масштабирование**: При необходимости можно запустить несколько worker:
   ```bash
   docker-compose scale celery_worker=3
   ```

## Полезные команды

```bash
# Посмотреть активные задачи
docker-compose exec celery_worker celery -A app.celery_app.celery_app inspect active

# Посмотреть расписание
docker-compose exec celery_beat celery -A app.celery_app.celery_app inspect scheduled

# Очистить очередь
docker-compose exec redis redis-cli FLUSHDB

# Проверить статус worker
docker-compose exec celery_worker celery -A app.celery_app.celery_app status
```

## Архив задач

Для хранения истории выполнения задач можно настроить Celery Results Backend:

```python
# В celery_app.py
celery_app.conf.update(
    result_extended=True,  # Расширенная информация о результатах
    result_expires=3600,   # Результаты хранятся 1 час
)
```

## Ссылки

- [Celery Documentation](https://docs.celeryproject.org/)
- [Celery Beat Documentation](https://docs.celeryproject.org/en/stable/userguide/periodic-tasks.html)
- [Flower Documentation](https://flower.readthedocs.io/)

