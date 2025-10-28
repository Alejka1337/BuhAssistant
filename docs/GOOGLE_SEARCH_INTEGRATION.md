# 🔍 Интеграция Google Custom Search API

## Текущее состояние
Сейчас поиск работает с **mock данными** для тестирования UI и логики.

## Как это работает сейчас:
1. Пользователь вводит запрос (например: "фоп 2 группа")
2. Выбирает источники (например: zakon.rada.gov.ua, buhgalter911.com.ua)
3. Формируются запросы: 
   - `фоп 2 группа site:zakon.rada.gov.ua`
   - `фоп 2 группа site:buhgalter911.com.ua`
4. **Mock функция** возвращает 3 тестовых результата для каждого сайта
5. Результаты отображаются плитками с title, description, url

## Для интеграции реального Google API:

### Шаг 1: Получить API ключи
1. Зайти в [Google Cloud Console](https://console.cloud.google.com/)
2. Создать новый проект (или использовать существующий)
3. Включить **Custom Search API**
4. Создать **API Key** в разделе Credentials

### Шаг 2: Создать Custom Search Engine
1. Зайти на [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Создать новый поисковый движок
3. В настройках выбрать "Search the entire web"
4. Получить **Search Engine ID (CX)**

### Шаг 3: Настроить переменные окружения
Создать файл `.env` в корне проекта:

```bash
GOOGLE_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_cx_here
```

### Шаг 4: Заменить mock функцию на реальную

В файле `utils/searchService.ts` раскомментировать функцию `fetchGoogleResultsReal` и заменить ею `fetchGoogleResults`.

```typescript
// Импортировать переменные окружения
import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey;
const GOOGLE_CX = Constants.expoConfig?.extra?.googleSearchEngineId;

// Использовать fetchGoogleResultsReal вместо mock функции
async function fetchGoogleResults(query: string, domain: string): Promise<SearchResult[]> {
  return fetchGoogleResultsReal(query, domain);
}
```

### Шаг 5: Добавить переменные в app.json
```json
{
  "expo": {
    "extra": {
      "googleApiKey": "YOUR_API_KEY",
      "googleSearchEngineId": "YOUR_CX"
    }
  }
}
```

## Альтернативные решения:

### 1. SerpAPI (Рекомендуется для MVP)
- Простая интеграция
- Лучшие результаты, чем Custom Search API
- Платный, но есть бесплатный тариф (100 запросов/месяц)
- [serpapi.com](https://serpapi.com/)

```typescript
async function fetchGoogleResultsWithSerpAPI(query: string, domain: string): Promise<SearchResult[]> {
  const searchQuery = `${query} site:${domain}`;
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${SERPAPI_KEY}&num=3`;

  const response = await fetch(url);
  const data = await response.json();

  return data.organic_results.slice(0, 3).map((item: any) => ({
    title: item.title,
    description: item.snippet,
    url: item.link,
    source: domain,
  }));
}
```

### 2. Backend прокси (Наиболее надежный вариант)
Создать endpoint на FastAPI:
```python
@app.get("/api/search")
async def search(query: str, sources: str):
    # Парсинг с использованием библиотеки googlesearch-python
    # или requests + BeautifulSoup
    pass
```

## Ограничения Google Custom Search API:
- **100 бесплатных запросов в день**
- После - $5 за 1000 запросов
- Максимум 10 результатов за запрос

## Рекомендации:
1. Для MVP - использовать SerpAPI (проще и надежнее)
2. Для production - backend прокси с кешированием в Redis
3. Добавить кеширование результатов на 1-2 часа
4. Реализовать rate limiting на клиенте

## Структура файлов:
```
utils/
  searchService.ts          # Основной сервис (mock сейчас)
  googleSearchAPI.ts        # Будущая интеграция с Google
  serpAPI.ts               # Альтернатива через SerpAPI

constants/
  sources.ts               # Список источников с доменами
```

## Testing:
После интеграции протестировать:
- [x] Поиск по одному источнику
- [x] Поиск по нескольким источникам
- [x] Поиск по всем источникам ("Всі")
- [x] Обработка ошибок сети
- [x] Loading states
- [x] Пустые результаты

---
**Статус:** Mock данные работают ✅  
**Следующий шаг:** Интеграция реального API

