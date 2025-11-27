# Search API Documentation

## Обзор

Search API позволяет выполнять поиск по авторитетным бухгалтерским источникам Украины с кешированием результатов и логированием запросов.

## Endpoints

### POST `/api/search/`

Выполнить поиск по выбранным источникам.

**Request Body:**
```json
{
  "query": "ФОП 2 група звітність",
  "sources": ["tax", "zakon"]
}
```

**Parameters:**
- `query` (string, required): Поисковый запрос (1-500 символов)
- `sources` (array, required): Список ID источников или `["all"]`

**Доступные source IDs:**
- `tax` - tax.gov.ua
- `zakon` - zakon.rada.gov.ua
- `buhgalter911` - buhgalter911.com.ua
- `ligazakon` - ligazakon.net
- `dtkt` - dtkt.ua
- `minfin` - minfin.gov.ua
- `diia` - diia.gov.ua
- `all` - поиск по всем источникам

**Response:**
```json
{
  "query": "ФОП 2 група звітність",
  "sources": ["tax", "zakon"],
  "results": [
    {
      "title": "Звітність ФОП 2 групи",
      "description": "Докладна інформація про звітність...",
      "url": "https://tax.gov.ua/article/123",
      "source": "tax.gov.ua"
    }
  ],
  "total_results": 3,
  "cached": false
}
```

**Response Fields:**
- `query`: Оригинальный запрос
- `sources`: Использованные источники
- `results`: Массив результатов поиска (топ-3 для каждого источника)
- `total_results`: Общее количество результатов
- `cached`: Были ли результаты взяты из кеша

### GET `/api/search/stats`

Получить статистику поисковых запросов.

**Response:**
```json
{
  "total_searches": 150,
  "popular_queries": [
    {
      "query": "ФОП 2 група",
      "count": 45
    },
    {
      "query": "ПДВ звітність",
      "count": 32
    }
  ]
}
```

## Кеширование

- Результаты кешируются в **Redis** на **1 час**
- Ключ кеша: `search:<md5(query:sources)>`
- При повторном запросе результаты возвращаются из кеша (поле `cached: true`)

## Логирование

Все поисковые запросы логируются в таблицу `search_logs`:

**Поля:**
- `query` - поисковый запрос
- `sources` - выбранные источники (JSON)
- `results_count` - количество найденных результатов
- `user_id` - ID пользователя (опционально)
- `ip_address` - IP адрес клиента
- `user_agent` - User-Agent браузера
- `created_at` - время запроса

## Google Parsing

### Архитектура

```
Client → FastAPI → Google Parser → BeautifulSoup4 → Google Search
                         ↓
                      Redis Cache
                         ↓
                      PostgreSQL Log
```

### Процесс парсинга

1. **Формирование запроса**: `{query} site:{domain}`
2. **HTTP запрос**: aiohttp с User-Agent заголовком
3. **Парсинг HTML**: BeautifulSoup4 с lxml парсером
4. **Извлечение данных**:
   - Title: `<h3>` теги
   - URL: `<a href>` атрибуты
   - Description: `<div class="VwiC3b">` и альтернативные селекторы
5. **Параллельная обработка**: asyncio.gather для нескольких источников

### Особенности

- **Множественные селекторы**: Google часто меняет структуру HTML
- **Timeout**: 10 секунд на запрос
- **Топ-3 результата** для каждого источника
- **Фильтрация**: только результаты с указанного домена
- **Обработка ошибок**: graceful degradation при сбоях

## Error Handling

**400 Bad Request:**
```json
{
  "detail": "Query cannot be empty"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Error performing search. Please try again later."
}
```

## Rate Limiting

⚠️ **TODO**: Добавить rate limiting для предотвращения злоупотреблений

Рекомендации:
- 10 запросов в минуту на IP
- 100 запросов в час на пользователя

## Production Considerations

### Google Blocking

Google может блокировать парсинг. Решения:

1. **Rotating User-Agents**: Использовать разные User-Agent
2. **Proxy Rotation**: Использовать прокси-сервера
3. **Rate Limiting**: Ограничить частоту запросов
4. **CAPTCHA Solving**: Интеграция сервисов решения капчи
5. **Alternative APIs**: Использовать Google Custom Search API или SerpAPI

### Оптимизация

- **Redis кеш**: Снижает нагрузку на Google
- **Async/await**: Параллельные запросы
- **Connection pooling**: aiohttp ClientSession
- **Batch processing**: Celery tasks для больших объемов

## Testing

### Manual Test

```bash
curl -X POST http://localhost:8000/api/search/ \
  -H "Content-Type: application/json" \
  -d '{"query": "ФОП 2 група", "sources": ["tax"]}'
```

### Check Stats

```bash
curl http://localhost:8000/api/search/stats
```

### Check Cache

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# List search keys
KEYS search:*

# Get cached result
GET search:<key>
```

## Frontend Integration

```typescript
// utils/searchService.ts
const response = await fetch('http://localhost:8000/api/search/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'ФОП 2 група',
    sources: ['tax', 'zakon']
  })
});

const data = await response.json();
console.log(data.results);
```

## Database Schema

```sql
CREATE TABLE search_logs (
    id SERIAL PRIMARY KEY,
    query VARCHAR NOT NULL,
    sources JSONB DEFAULT '[]',
    results_count INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR,
    user_agent VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ON search_logs(query);
CREATE INDEX ON search_logs(created_at);
```

## Future Improvements

- [ ] Добавить персонализацию результатов
- [ ] Интеграция с Elasticsearch для полнотекстового поиска
- [ ] ML-модель для ранжирования результатов
- [ ] Автокомплит запросов
- [ ] Синонимы и исправление опечаток
- [ ] Фильтрация по дате публикации
- [ ] Сохранение избранных результатов

