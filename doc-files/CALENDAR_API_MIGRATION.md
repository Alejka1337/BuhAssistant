# Calendar API Migration - Complete! ✅

## Цель

Перенести календарь бухгалтерских отчетов с локальных JSON файлов на backend API для упрощения обновления дат и событий без необходимости пересборки приложения.

---

## Что сделано

### Backend (100%)

#### 1. Структура данных
```
backend/
  data/
    calendar/
      10_2025.json  ✅ (16 events)
      11_2025.json  ✅ (82 events)
```

#### 2. Pydantic схемы (`backend/app/schemas/calendar.py`)
```python
class CalendarEvent(BaseModel):
    date: str  # "DD.MM.YYYY"
    type: str  # "Статистика", "Податки", etc.
    title: str
    who: str   # "ФОП", "Юрособи", etc.

class CalendarResponse(BaseModel):
    month: int
    year: int
    events: List[CalendarEvent]
```

#### 3. Сервисный слой (`backend/app/services/calendar_service.py`)
- `get_calendar_events(month, year)` - загрузка из JSON
- `get_available_periods()` - сканирование доступных месяцев
- `validate_calendar_data()` - валидация структуры

#### 4. API Endpoints (`backend/app/api/calendar.py`)
- ✅ `GET /api/calendar/?month=10&year=2025` - получить календарь
- ✅ `GET /api/calendar/available-months` - список доступных периодов
- ✅ `GET /api/calendar/health` - health check

#### 5. Интеграция в main.py
```python
from app.api import calendar
app.include_router(calendar.router, tags=["calendar"])
```

---

### Frontend (100%)

#### 1. Calendar Service (`utils/calendarService.ts`)
```typescript
export const fetchCalendarEvents = async (
  month: number, 
  year: number
): Promise<CalendarEvent[]>

export const fetchAvailablePeriods = async (): Promise<AvailablePeriod[]>

export const fetchMultipleMonths = async (
  periods: AvailablePeriod[]
): Promise<CalendarEvent[]>
```

#### 2. API Configuration (`constants/api.ts`)
```typescript
export const API_ENDPOINTS = {
  // ...
  CALENDAR: `${API_URL}/api/calendar`,
};
```

#### 3. Component Refactoring (`components/AccountingCalendar.tsx`)

**Было:**
```typescript
import data_10_2025 from '../data/10_2025.json';
import data_11_2025 from '../data/11_2025.json';
const combinedData = [...data_10_2025, ...data_11_2025];
```

**Стало:**
```typescript
import { fetchCalendarEvents } from '../utils/calendarService';

useEffect(() => {
  const loadCalendarData = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const [currentMonthData, nextMonthData] = await Promise.all([
      fetchCalendarEvents(currentMonth, currentYear),
      fetchCalendarEvents(currentMonth + 1, currentYear)
    ]);
    
    const allEvents = [...currentMonthData, ...nextMonthData];
    // ... обработка
  };
  
  loadCalendarData();
}, []);
```

---

## Тестирование

### Backend Tests ✅

```bash
# Тест 1: Получить календарь за октябрь 2025
curl 'http://localhost:8000/api/calendar/?month=10&year=2025'
# Результат: ✅ 16 events loaded

# Тест 2: Получить доступные месяцы
curl 'http://localhost:8000/api/calendar/available-months'
# Результат: ✅ 2 periods (10/2025, 11/2025)

# Тест 3: Health check
curl 'http://localhost:8000/api/calendar/health'
# Результат: ✅ healthy, 2 available periods
```

### Frontend Tests (Ready to test)
1. Открыть приложение в эмуляторе
2. Перейти на вкладку "Календар"
3. Проверить что загружаются события с сервера
4. Проверить фильтры (должны работать как раньше)
5. Проверить обработку ошибок (выключить backend)

---

## API Documentation

### GET /api/calendar/

Получить календарь бухгалтерских отчетов

**Query Parameters:**
- `month` (required): Месяц (1-12)
- `year` (required): Год (2020-2100)

**Response:**
```json
{
  "month": 10,
  "year": 2025,
  "events": [
    {
      "date": "27.10.2025",
      "type": "Статистика",
      "title": "37-сг (місячна) Звіт про збирання врожаю...",
      "who": "Сільськогосподарські підприємства"
    }
  ]
}
```

**Status Codes:**
- `200` - OK
- `404` - Calendar not found for this month/year
- `500` - Internal server error

---

### GET /api/calendar/available-months

Получить список доступных периодов

**Response:**
```json
{
  "periods": [
    {"month": 10, "year": 2025},
    {"month": 11, "year": 2025}
  ]
}
```

---

### GET /api/calendar/health

Health check календарного API

**Response:**
```json
{
  "status": "healthy",
  "service": "calendar",
  "available_periods": 2,
  "periods_sample": [
    {"month": 10, "year": 2025},
    {"month": 11, "year": 2025}
  ]
}
```

---

## Как обновлять календарь

### Вариант 1: Вручную через файлы

1. Подключиться к серверу (EC2)
2. Открыть файл `/backend/data/calendar/{month}_{year}.json`
3. Отредактировать JSON (добавить/удалить/изменить события)
4. Сохранить файл
5. Изменения доступны сразу (без перезапуска)

**Пример:**
```bash
# На сервере
cd /path/to/backend/data/calendar
nano 12_2025.json
# Отредактировать
# Ctrl+X, Y, Enter
```

### Вариант 2: Через API (будущее)

Можно добавить endpoint для загрузки новых JSON файлов:
```
POST /api/calendar/import
Content-Type: multipart/form-data

file: 12_2025.json
```

**Примечание**: Требует авторизации (реализуется на Этапе 6)

---

## Преимущества решения

### 1. Централизованное управление
- Все календари в одном месте (`/backend/data/calendar/`)
- Легко найти и отредактировать
- Версионирование через git

### 2. Без пересборки приложения
- Обновили JSON на сервере → сразу доступно в приложении
- Пользователи не качают обновление из App Store/Google Play
- Критические изменения дат применяются моментально

### 3. Масштабируемость
- Легко добавлять новые месяцы/годы
- Просто создать файл `{month}_{year}.json`
- API автоматически обнаружит новый период

### 4. Совместимость
- Структура JSON осталась прежней
- Компонент работает как раньше
- Только изменен способ загрузки данных

### 5. Производительность
- Параллельная загрузка месяцев (`Promise.all`)
- Минимальный размер данных (только нужные месяцы)
- Возможность добавить кэширование в будущем

---

## Следующие шаги (опционально)

### 1. AsyncStorage кэширование
Сохранять календарь локально для offline режима:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheCalendar = async (month: number, year: number, data: CalendarEvent[]) => {
  await AsyncStorage.setItem(
    `calendar_${month}_${year}`,
    JSON.stringify(data)
  );
};
```

### 2. Pull-to-refresh
Добавить возможность обновить календарь жестом:
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadCalendarData();
  setRefreshing(false);
};
```

### 3. Выбор месяца/года
Добавить UI для выбора конкретного месяца:
```typescript
<Picker
  selectedValue={selectedPeriod}
  onValueChange={(period) => loadMonth(period)}
>
  {availablePeriods.map(p => (
    <Picker.Item label={`${p.month}/${p.year}`} value={p} />
  ))}
</Picker>
```

### 4. Admin panel
Создать веб-интерфейс для управления календарем:
- Загрузка новых JSON файлов
- Редактирование событий
- Предпросмотр перед публикацией

---

## Файлы для удаления (после успешного тестирования)

После того как убедитесь что календарь работает с backend API, можно удалить:
- ✅ `data/10_2025.json`
- ✅ `data/11_2025.json`

**Команда:**
```bash
rm -rf /Users/alejka1337/Desktop/buhassistant/data/*.json
# или удалить всю папку, если других файлов там нет
rm -rf /Users/alejka1337/Desktop/buhassistant/data/
```

---

## Troubleshooting

### Проблема: Calendar API возвращает 404

**Причина**: JSON файл не найден на сервере

**Решение**:
1. Проверить наличие файла:
```bash
ls /backend/data/calendar/{month}_{year}.json
```

2. Создать файл если его нет:
```bash
cp /backend/data/calendar/10_2025.json /backend/data/calendar/12_2025.json
nano /backend/data/calendar/12_2025.json
```

---

### Проблема: Frontend показывает "Не вдалося завантажити календар"

**Причина**: Backend не доступен или неправильный API_URL

**Решение**:
1. Проверить backend:
```bash
curl http://localhost:8000/api/health
```

2. Проверить `constants/api.ts`:
```typescript
export const API_URL = __DEV__ 
  ? 'http://localhost:8000'  // ← Правильный URL?
  : 'https://your-production-api.com';
```

3. Для Android Emulator использовать:
```typescript
Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'
```

---

### Проблема: События не отображаются

**Причина**: Неправильная структура JSON или ошибка парсинга

**Решение**:
1. Проверить логи backend:
```bash
docker-compose logs backend | grep calendar
```

2. Проверить структуру JSON:
```json
[
  {
    "date": "01.12.2025",
    "type": "Податки",
    "title": "Назва звіту",
    "who": "ФОП"
  }
]
```

3. Валидировать JSON онлайн: https://jsonlint.com/

---

## Summary

✅ **Миграция календаря успешно завершена!**

- Backend API работает и протестирован
- Frontend компонент обновлен и готов к использованию
- Документация создана
- План разработки обновлен (Этап 5 добавлен)

**Теперь можно:**
1. Тестировать календарь в приложении
2. Обновлять события через JSON файлы на сервере
3. Добавлять новые месяцы без пересборки приложения

**Следующий этап:** Авторизация (Этап 6)

