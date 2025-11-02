# BuhAssistant Backend

FastAPI бэкенд для приложения BuhAssistant.

## Технологический стек

- **FastAPI** - веб-фреймворк
- **PostgreSQL** - основная база данных
- **Redis** - кеширование и Celery broker
- **Elasticsearch** - полнотекстовый поиск
- **Celery** - фоновые задачи (краулеры, push-уведомления)
- **SQLAlchemy** - ORM
- **Alembic** - миграции БД
- **Docker** - контейнеризация
- **Google Custom Search API** - поиск по авторитетным источникам 🎉

## ⚡ Google Custom Search API

**BuhAssistant использует официальный Google Custom Search API для поиска.**

**Уже настроено и работает:**
- ✅ API Key: `AIzaSyDpMX9zXOhKgQ09-JFzam2_oMM0HFBkb70`
- ✅ Search Engine ID: `f135af156ff3f4423`
- ✅ Локализация: Украина (gl=ua), украинский язык (hl=uk)
- ✅ Автоматический fallback на mock данные если API недоступен

**Лимиты:**
- 100 бесплатных запросов/день
- $5 за 1000 дополнительных запросов
- Максимум 10,000 запросов/день

**Отслеживание использования:**
- [Google Cloud Console](https://console.cloud.google.com/)
- [Search Engine Dashboard](https://programmablesearchengine.google.com/controlpanel/all)

## Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Скопируйте `env.example` в `.env` и заполните необходимые значения:

```bash
cp env.example .env
```

### 3. Запуск с Docker Compose

Из корня проекта:

```bash
docker-compose up -d
```

Это запустит все сервисы:
- PostgreSQL (порт 5432)
- Redis (порт 6379)
- Elasticsearch (порт 9200)
- FastAPI (порт 8000)
- Celery Worker
- Celery Beat

### 4. Применение миграций

```bash
cd backend
alembic upgrade head
```

### 5. Создание новой миграции

```bash
alembic revision --autogenerate -m "description"
```

## Разработка

### Запуск без Docker

1. Убедитесь что PostgreSQL, Redis и Elasticsearch запущены
2. Примените миграции: `alembic upgrade head`
3. Запустите сервер: `uvicorn app.main:app --reload`

### Структура проекта

```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Конфигурация
│   ├── db/            # Database setup
│   ├── models/        # SQLAlchemy модели
│   ├── schemas/       # Pydantic схемы
│   ├── services/      # Бизнес-логика
│   ├── crawlers/      # Веб-скрейперы
│   └── main.py        # Главный файл
├── migrations/        # Alembic миграции
├── tests/            # Тесты
├── Dockerfile
├── requirements.txt
└── alembic.ini
```

## API Документация

После запуска сервера доступна по адресу:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Health Check Endpoints

- `GET /api/health` - базовый health check
- `GET /api/health/db` - проверка PostgreSQL
- `GET /api/health/redis` - проверка Redis
- `GET /api/health/all` - проверка всех сервисов

## Полезные команды

```bash
# Создать новую миграцию
alembic revision --autogenerate -m "Add users table"

# Применить миграции
alembic upgrade head

# Откатить последнюю миграцию
alembic downgrade -1

# Показать текущую версию БД
alembic current

# Показать историю миграций
alembic history

# Запустить Celery worker
celery -A app.celery_app worker --loglevel=info

# Запустить Celery beat
celery -A app.celery_app beat --loglevel=info
```

## Production Deployment

См. `.gitlab-ci.yml` для настройки CI/CD pipeline.

Основные шаги:
1. Build Docker образ
2. Push в registry
3. Deploy на EC2 через SSH
4. Применить миграции
5. Перезапустить сервисы

