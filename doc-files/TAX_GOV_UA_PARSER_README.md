# Tax.gov.ua Playwright Parser

## Описание

Парсер для сайта tax.gov.ua с использованием Playwright для обхода CDN защиты и динамической загрузки контента.

## Установка

### 1. Обновить requirements.txt

Уже добавлено: `playwright==1.40.0`

### 2. Установить зависимости в Docker

```bash
# Пересобрать Docker image
cd /Users/alejka1337/Desktop/buhassistant/backend
docker-compose build backend
```

### 3. Установить Playwright браузеры (если локально)

```bash
# Внутри контейнера или локально
playwright install chromium
playwright install-deps
```

## Использование

### Тестирование парсера

```bash
# Запустить тест парсера
docker-compose exec backend python -m app.crawlers.tax_gov_ua_playwright
```

Ожидаемый вывод:
```
INFO: Инициализация Playwright браузера...
INFO: Playwright браузер инициализирован
INFO: Переход на страницу: https://tax.gov.ua/media-tsentr/novini/
INFO: Страница успешно загружена, ожидаем появления новостей...
INFO: Найдено 20 новостей
INFO: Успешно спарсено 20 новостей с tax.gov.ua

Найдено новостей: 20

1. «Податкові інспектори без кордонів»: Україна посилює контроль за трансфертним ціноутворенням
   URL: https://tax.gov.ua/media-tsentr/novini/955729.html
   Дата: 21 листопада 2025
...
```

## Структура парсера

### Класс `TaxGovUaPlaywrightCrawler`

**Методы:**

- `initialize()` - Инициализация браузера Playwright
- `close()` - Закрытие браузера
- `parse_news_list()` - Парсинг списка новостей со страницы
- `parse_article_content(url)` - Парсинг содержимого отдельной статьи
- `parse_ukrainian_date(date_str)` - Парсинг украинской даты

**Контекстный менеджер:**

```python
async with TaxGovUaPlaywrightCrawler() as crawler:
    news = await crawler.parse_news_list()
```

### Функция `crawl_tax_gov_ua()`

Основная функция для использования в Celery tasks.

```python
from app.crawlers.tax_gov_ua_playwright import crawl_tax_gov_ua

# Получить список новостей
news_items = await crawl_tax_gov_ua()
```

## Структура возвращаемых данных

```python
{
    'title': str,           # Заголовок новости
    'url': str,             # Полный URL статьи
    'date': str,            # Дата в формате "21 листопада 2025"
    'source': str,          # "tax.gov.ua"
    'raw_date': str,        # Оригинальная дата
    'published_date': str,  # ISO формат datetime
}
```

## Интеграция с Celery

### Обновить существующий Celery task

**Файл:** `backend/app/tasks/crawlers.py`

Добавить импорт:

```python
from app.crawlers.tax_gov_ua_playwright import crawl_tax_gov_ua
```

Обновить task `crawl_all_news_sources_task`:

```python
@celery_app.task
def crawl_all_news_sources_task():
    """Celery task для парсинга всех источников новостей"""
    # ... существующий код ...
    
    # Добавить Tax.gov.ua (Playwright)
    try:
        logger.info("Парсинг tax.gov.ua (Playwright)...")
        tax_gov_news = asyncio.run(crawl_tax_gov_ua())
        logger.info(f"Получено {len(tax_gov_news)} новостей с tax.gov.ua")
        
        # Фильтрация и сохранение через существующую логику
        for news_item in tax_gov_news:
            # Используем существующую фильтрацию через OpenAI
            process_and_save_news(news_item)
    except Exception as e:
        logger.error(f"Ошибка парсинга tax.gov.ua: {str(e)}")
```

## Особенности парсера

### 1. Обход CDN защиты

- Использует реальный браузер (Chromium)
- Устанавливает User-Agent
- Ждет полной загрузки страницы (`networkidle`)

### 2. Парсинг дат

Поддерживает украинские названия месяцев:
- січня, лютого, березня, квітня, травня, червня
- липня, серпня, вересня, жовтня, листопада, грудня

### 3. Извлечение контента

Метод `parse_article_content(url)` может парсить:
- Текстовое содержимое статьи
- Изображения
- Удаляет скрипты, стили, рекламу

## Troubleshooting

### Проблема: "Executable doesn't exist at /root/.cache/ms-playwright/chromium-*/chrome-linux/chrome"

**Решение:**

```bash
# Установить браузеры в контейнере
docker-compose exec backend playwright install chromium
docker-compose exec backend playwright install-deps
```

### Проблема: Timeout при загрузке страницы

**Решение:**

1. Увеличить timeout в коде:
```python
self.page.set_default_timeout(60000)  # 60 секунд
```

2. Проверить доступность сайта:
```bash
curl -I https://tax.gov.ua/media-tsentr/novini/
```

### Проблема: Не находит элементы на странице

**Решение:**

1. Проверить селекторы:
```python
await self.page.screenshot(path='debug.png')  # Сделать скриншот
```

2. Обновить селекторы, если структура сайта изменилась

## Production Considerations

### 1. Rate Limiting

Добавить задержки между запросами:

```python
await asyncio.sleep(2)  # 2 секунды между страницами
```

### 2. Error Handling

Парсер уже включает:
- Try-catch блоки
- Логирование ошибок
- Graceful degradation

### 3. Resource Management

- Браузер автоматически закрывается через контекстный менеджер
- Используется `headless=True` для экономии ресурсов
- Один браузер на задачу

### 4. Мониторинг

Логи парсера:
```bash
docker-compose logs -f backend | grep "tax.gov.ua"
```

## Дальнейшие улучшения

1. **Кеширование:** Сохранять хеши статей, чтобы не парсить повторно
2. **Прокси:** Добавить ротацию прокси для обхода rate limits
3. **Retry механизм:** Автоматический retry при ошибках
4. **Incremental парсинг:** Парсить только новые статьи с последнего запуска
5. **Parallel парсинг:** Парсить несколько страниц параллельно

## Пример использования в коде

```python
import asyncio
from app.crawlers.tax_gov_ua_playwright import crawl_tax_gov_ua

async def main():
    # Получить новости
    news = await crawl_tax_gov_ua()
    
    # Обработать новости
    for item in news:
        print(f"Заголовок: {item['title']}")
        print(f"URL: {item['url']}")
        print(f"Дата: {item['published_date']}")
        print("-" * 80)

# Запустить
asyncio.run(main())
```

## Ссылки

- [Playwright Documentation](https://playwright.dev/python/)
- [Tax.gov.ua](https://tax.gov.ua/media-tsentr/novini/)
- [Celery Best Practices](https://docs.celeryproject.org/en/stable/userguide/tasks.html)

