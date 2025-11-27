# Celery Parsers Integration - Полная интеграция парсеров

## ✅ Статус: Интеграция завершена

Все 6 парсеров новостей успешно интегрированы в Celery tasks для автоматического запуска 2 раза в день (8:00 и 20:00).

---

## 📊 Список интегрированных парсеров

| № | Источник | Технология | Task Name | Endpoint |
|---|----------|------------|-----------|----------|
| 1 | **minfin.com.ua** | BS4 + aiohttp | `crawl_minfin_news_task` | `/api/news/crawl/minfin` |
| 2 | **liga.net** | BS4 + aiohttp | `crawl_liga_net_news_task` | `/api/news/crawl/liga-net` |
| 3 | **buhgalter911.com** | BS4 + aiohttp | `crawl_buhgalter911_news_task` | `/api/news/crawl/buhgalter911` |
| 4 | **tax.gov.ua** ⭐ | Playwright | `crawl_tax_gov_ua_playwright_task` | `/api/news/crawl/tax-gov-ua-playwright` |
| 5 | **diia.gov.ua** ⭐ | Playwright | `crawl_diia_gov_ua_playwright_task` | `/api/news/crawl/diia-gov-ua-playwright` |
| 6 | **dtkt.ua** ⭐ | BS4 + aiohttp | `crawl_dtkt_task` | `/api/news/crawl/dtkt` |

⭐ = Новые парсеры, добавленные в этой интеграции

---

## 🔧 Файлы и изменения

### 1. Crawler Tasks: `backend/app/tasks/crawler_tasks.py`

**Добавлено:**

```python
# Импорты новых парсеров
from app.crawlers.tax_gov_ua_playwright import crawl_tax_gov_ua as crawl_tax_gov_ua_playwright
from app.crawlers.diia_gov_ua_playwright import crawl_diia_gov_ua as crawl_diia_gov_ua_playwright
from app.crawlers.dtkt_crawler import crawl_dtkt
```

**Новые tasks:**

1. `crawl_tax_gov_ua_playwright_task()` - Парсер tax.gov.ua через Playwright
2. `crawl_diia_gov_ua_playwright_task()` - Парсер diia.gov.ua через Playwright
3. `crawl_dtkt_task()` - Парсер dtkt.ua через BS4

**Обновлен `crawl_all_news_sources_task()`:**

Теперь запускает все 6 парсеров последовательно:

```python
# 1. Minfin.com.ua
# 2. Liga.net
# 3. Buhgalter911.com
# 4. Tax.gov.ua (Playwright) ⭐ NEW
# 5. Diia.gov.ua (Playwright) ⭐ NEW
# 6. Dtkt.ua (BS4) ⭐ NEW
```

### 2. API Endpoints: `backend/app/api/news.py`

**Добавлено:**

- `POST /api/news/crawl/tax-gov-ua-playwright` - Ручной запуск парсера tax.gov.ua
- `POST /api/news/crawl/diia-gov-ua-playwright` - Ручной запуск парсера diia.gov.ua
- `POST /api/news/crawl/dtkt` - Ручной запуск парсера dtkt.ua

### 3. Новые парсеры

**Файлы:**

- `backend/app/crawlers/tax_gov_ua_playwright.py` - Playwright парсер для tax.gov.ua
- `backend/app/crawlers/diia_gov_ua_playwright.py` - Playwright парсер для diia.gov.ua
- `backend/app/crawlers/dtkt_crawler.py` - BS4 парсер для dtkt.ua

---

## 🚀 Автоматический запуск

### Расписание (Celery Beat)

Все парсеры запускаются **2 раза в день** через `crawl_all_news_sources_task`:

```python
# backend/app/celery_app.py
app.conf.beat_schedule = {
    'crawl-all-news-sources': {
        'task': 'crawl_all_news_sources_task',
        'schedule': crontab(hour='8,20', minute=0),  # 8:00 и 20:00 UTC
    }
}
```

**Время по Киеву (UTC+2):**
- 🕘 **10:00** (утро)
- 🕚 **22:00** (вечер)

### Процесс выполнения

Для каждого источника:

1. **Парсинг** - Извлечение новостей с сайта
2. **Фильтрация через OpenAI** - Отбор только релевантных статей для бухгалтеров/ФОП
3. **Проверка на дубликаты** - По URL в базе данных
4. **Сохранение в БД** - Только новые релевантные новости

### Логирование

```
🕷️ Starting FULL NEWS CRAWL at 2025-11-22T18:00:00
================================================================================
📰 [1/6] Crawling Minfin.com.ua...
✅ Minfin: {'status': 'success', 'parsed': 200, 'filtered': 10, 'saved': 5}

📰 [2/6] Crawling Liga.net...
✅ Liga.net: {'status': 'success', 'source': 'liga.net', 'parsed': 54, 'filtered': 3, 'saved': 2}

📰 [3/6] Crawling Buhgalter911.com...
✅ Buhgalter911.com: {'status': 'success', 'source': 'buhgalter911.com', 'parsed': 30, 'filtered': 11, 'saved': 8}

📰 [4/6] Crawling Tax.gov.ua (Playwright)...
✅ Tax.gov.ua: {'status': 'success', 'source': 'tax.gov.ua', 'parsed': 12, 'filtered': 5, 'saved': 5}

📰 [5/6] Crawling Diia.gov.ua (Playwright)...
✅ Diia.gov.ua: {'status': 'success', 'source': 'diia.gov.ua', 'parsed': 6, 'filtered': 1, 'saved': 1}

📰 [6/6] Crawling Dtkt.ua...
✅ Dtkt.ua: {'status': 'success', 'source': 'dtkt.ua', 'parsed': 36, 'filtered': 25, 'saved': 25}

================================================================================
🎉 FULL NEWS CRAWL COMPLETED
   Total parsed: 338
   Total filtered by OpenAI: 55
   Total saved to DB: 46
   Total skipped (duplicates): 9
================================================================================
```

---

## 🧪 Ручное тестирование

### 1. Тестирование отдельного парсера

**Через Swagger UI:**
```
http://localhost:8000/docs
```

Найти endpoint `/api/news/crawl/{source}` и нажать "Try it out".

**Через curl:**

```bash
# Tax.gov.ua (Playwright)
curl -X POST http://localhost:8000/api/news/crawl/tax-gov-ua-playwright

# Diia.gov.ua (Playwright)
curl -X POST http://localhost:8000/api/news/crawl/diia-gov-ua-playwright

# Dtkt.ua
curl -X POST http://localhost:8000/api/news/crawl/dtkt

# Все источники сразу (через API)
# (Используйте Celery task для production)
```

### 2. Тестирование Celery task

**Запуск через Python:**

```python
from app.tasks.crawler_tasks import crawl_all_news_sources_task

# Синхронный запуск (блокирующий)
result = crawl_all_news_sources_task()
print(result)
```

**Запуск через Celery CLI:**

```bash
# Войти в контейнер
docker exec -it buhassistant_celery_worker bash

# Запустить task
celery -A app.celery_app call crawl_all_news_sources_task

# Выйти
exit
```

### 3. Проверка расписания

```bash
# Логи Celery Beat (планировщик)
docker-compose logs -f celery_beat

# Логи Celery Worker (исполнитель)
docker-compose logs -f celery_worker
```

---

## 📈 Мониторинг

### Проверка количества новостей в БД

```bash
# Подключиться к PostgreSQL
docker exec -it buhassistant_postgres psql -U postgres -d buhassistant

# SQL запросы
SELECT COUNT(*) FROM news;  -- Всего новостей

SELECT source, COUNT(*) as count 
FROM news 
GROUP BY source 
ORDER BY count DESC;  -- По источникам

SELECT 
    DATE(created_at) as date,
    COUNT(*) as count
FROM news
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;  -- За последние 7 дней

\q  -- Выход
```

### Просмотр статистики через API

```bash
curl http://localhost:8000/api/news/stats | python3 -m json.tool
```

Ответ:

```json
{
    "total_news": 500,
    "published_news": 495,
    "by_source": [
        {"source": "dtkt.ua", "count": 150},
        {"source": "minfin.com.ua", "count": 120},
        {"source": "liga.net", "count": 90},
        {"source": "buhgalter911.com", "count": 70},
        {"source": "tax.gov.ua", "count": 40},
        {"source": "diia.gov.ua", "count": 30}
    ],
    "top_categories": [
        {"category": "податки", "count": 200},
        {"category": "звітність", "count": 150},
        ...
    ]
}
```

---

## 🐛 Troubleshooting

### 1. Playwright не установлен

**Ошибка:**
```
ModuleNotFoundError: No module named 'playwright'
```

**Решение:**

```bash
# Пересоберите Docker контейнеры
cd backend
docker-compose up -d --build
```

### 2. Браузеры Playwright не найдены

**Ошибка:**
```
Executable doesn't exist at /home/appuser/.cache/ms-playwright/chromium-1091/chrome-linux/chrome
```

**Решение:**

Уже исправлено в `Dockerfile`:

```dockerfile
# Переключаемся на appuser
USER appuser

# Копируем код
COPY . .

# Устанавливаем браузеры для appuser
RUN playwright install chromium
```

### 3. Event loop is closed

**Ошибка:**
```
RuntimeError: Event loop is closed
```

**Решение:**

В Celery tasks используем новый event loop:

```python
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
result = loop.run_until_complete(async_function())
loop.close()
```

### 4. OpenAI Rate Limit

**Ошибка:**
```
RateLimitError: Rate limit exceeded
```

**Решение:**

1. Увеличьте интервал между запросами
2. Используйте batch обработку
3. Увеличьте лимит в OpenAI аккаунте

### 5. PostgreSQL connection refused

**Ошибка:**
```
could not connect to server: Connection refused
```

**Решение:**

```bash
# Проверьте, что PostgreSQL запущен
docker-compose ps

# Перезапустите контейнеры
docker-compose restart
```

---

## 📝 Следующие шаги

### ✅ Завершено:

1. ✅ Создание всех 6 парсеров
2. ✅ Интеграция в Celery tasks
3. ✅ Автоматическое расписание 2x в день
4. ✅ API endpoints для ручного запуска
5. ✅ Фильтрация через OpenAI
6. ✅ Проверка дубликатов
7. ✅ Docker + Playwright setup

### 🔜 В планах (Этап 4+):

1. **Мониторинг и алерты** - Уведомления при ошибках парсинга
2. **Расширение источников** - Добавление новых сайтов
3. **Улучшение фильтрации** - Fine-tuning OpenAI для более точной категоризации
4. **Кеширование** - Redis для уменьшения нагрузки на БД
5. **Деплой на AWS** - EC2 + RDS + S3

---

## 🎯 Итоги

**Всего источников:** 6
- 3 классических (BS4 + aiohttp)
- 2 Playwright (для обхода CDN)
- 1 новый BS4 (dtkt.ua)

**Автоматизация:**
- ✅ Celery tasks
- ✅ Celery Beat scheduler
- ✅ 2 запуска в день

**Production ready:**
- ✅ Логирование
- ✅ Error handling
- ✅ Проверка дубликатов
- ✅ OpenAI фильтрация
- ✅ Docker контейнеры

**Все парсеры интегрированы и готовы к production! 🎉**

