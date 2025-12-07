# 🚀 Гайд по деплою на продакшн

## 📋 Что будет задеплоено

### Новые фичи:
1. **Жалобы и блокировки пользователей** (`ContentReport`, `UserBlock`)
2. **Роли пользователей** (`UserRole`: USER, MODERATOR, ADMIN)
3. **AI модерация форума** (OpenAI Moderation + GPT-4 Mini)
4. **Статьи** (`Article` с SEO мета-тегами)
5. **Загрузка медиа** (изображения, документы)
6. **Новые парсеры** (buhplatforma.com.ua, 7eminar.ua)
7. **Push-уведомления для анонимных пользователей** (`AnonymousPushToken`)

### Миграции БД:
```
2025_12_02_1903 - add_content_reports_and_user_blocks
2025_12_03_1240 - add_role_to_users
2025_12_05_1948 - add_anonymous_push_tokens
2025_12_06_1922 - add_moderation_logs_table
2025_12_06_2118 - add_articles_table
2025_12_07_1557 - add_seo_meta_fields_to_articles
```

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО

### 1. Новые переменные окружения

Добавьте в `/root/buhassistant/backend/.env` на продакшн:

```bash
# OpenAI (для модерации форума)
OPENAI_API_KEY=your-openai-api-key-here

# Expo Push Notifications (если еще нет)
EXPO_ACCESS_TOKEN=your-expo-access-token-here

# Google Custom Search API (если еще нет)
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_CX=your-google-cx-here
```

### 2. Создать директорию для медиа

```bash
mkdir -p /root/buhassistant/backend/static/uploads
chmod 755 /root/buhassistant/backend/static
chmod 755 /root/buhassistant/backend/static/uploads
```

---

## 🔧 Пошаговая инструкция

### Шаг 1: Подготовка локально

```bash
# Убедитесь, что все изменения закоммичены
cd /Users/alejka1337/Desktop/buhassistant
git status

# Если есть незакоммиченные изменения:
git add .
git commit -m "feat: add moderation, articles, media uploads, new parsers"
git push origin main
```

---

### Шаг 2: Бэкап БД на продакшн

**ОБЯЗАТЕЛЬНО сделайте бэкап перед миграциями!**

```bash
# SSH на сервер
ssh root@your-production-server

# Бэкап PostgreSQL
docker exec buhassistant-postgres-1 pg_dump -U eglavbuh_user eglavbuh_db > /root/backup_$(date +%Y%m%d_%H%M%S).sql

# Проверка бэкапа
ls -lh /root/backup_*.sql
```

---

### Шаг 3: Обновление кода на продакшн

```bash
# На сервере
cd /root/buhassistant

# Остановить сервисы (чтобы избежать конфликтов)
docker-compose down

# Получить последние изменения
git pull origin main

# Проверить, что все файлы обновились
git log -1
```

---

### Шаг 4: Обновление .env

```bash
# Откройте .env на редактирование
nano /root/buhassistant/backend/.env

# Добавьте/проверьте:
# - OPENAI_API_KEY
# - EXPO_ACCESS_TOKEN
# - GOOGLE_API_KEY
# - GOOGLE_CX

# Сохраните: Ctrl+O, Enter, Ctrl+X
```

---

### Шаг 5: Создание директории для медиа

```bash
# Создать папку для загрузок
mkdir -p /root/buhassistant/backend/static/uploads

# Установить права
chmod -R 755 /root/buhassistant/backend/static

# Убедиться, что .gitignore не блокирует папку
echo "uploads/*" >> /root/buhassistant/backend/static/.gitignore
echo "!uploads/.gitkeep" >> /root/buhassistant/backend/static/.gitignore
touch /root/buhassistant/backend/static/uploads/.gitkeep
```

---

### Шаг 6: Пересборка и запуск контейнеров

```bash
# Пересобрать образы (для новых зависимостей)
docker-compose build --no-cache backend

# Запустить контейнеры
docker-compose up -d

# Проверить, что контейнеры запустились
docker-compose ps
```

**Ожидаемый вывод:**
```
NAME                      STATUS         PORTS
buhassistant-backend-1    Up             0.0.0.0:8000->8000/tcp
buhassistant-celery-1     Up
buhassistant-celery-beat-1 Up
buhassistant-postgres-1   Up             5432/tcp
buhassistant-redis-1      Up             6379/tcp
```

---

### Шаг 7: Применение миграций

```bash
# Войти в контейнер backend
docker exec -it buhassistant-backend-1 bash

# Внутри контейнера:
cd /app

# Проверить текущую версию БД
alembic current

# Показать список всех миграций
alembic history

# Применить все новые миграции
alembic upgrade head

# Проверить, что миграции применились
alembic current

# Выйти из контейнера
exit
```

---

### Шаг 8: Перезапуск Celery (для новых задач)

```bash
# Перезапустить Celery Worker и Beat
docker-compose restart celery celery-beat

# Проверить логи
docker-compose logs -f celery --tail=50
docker-compose logs -f celery-beat --tail=50

# Должны увидеть новые задачи:
# - crawl_buhplatforma_news
# - crawl_7eminar_news
# - send_push_to_anonymous_users
```

---

### Шаг 9: Проверка работоспособности

#### 9.1 Проверка API

```bash
# Проверка healthcheck
curl https://your-domain.com/health

# Проверка статики (должен вернуть 404, но не 500)
curl -I https://your-domain.com/api/media/images/test.png
```

#### 9.2 Проверка БД

```bash
# Войти в PostgreSQL
docker exec -it buhassistant-postgres-1 psql -U eglavbuh_user -d eglavbuh_db

# Проверить новые таблицы:
\dt

# Должны увидеть:
# - content_reports
# - user_blocks
# - moderation_logs
# - articles
# - anonymous_push_tokens

# Проверить поле role в users:
SELECT id, email, role FROM users LIMIT 5;

# Выйти из PostgreSQL:
\q
```

#### 9.3 Проверка Celery задач

```bash
# Проверить зарегистрированные задачи
docker exec -it buhassistant-celery-1 celery -A app.celery_app inspect registered

# Должны увидеть:
# - app.tasks.crawlers.crawl_buhplatforma_news
# - app.tasks.crawlers.crawl_7eminar_news
# - app.tasks.notifications.send_news_notification_to_all
# - app.tasks.notifications.send_push_to_anonymous_users
```

---

### Шаг 10: Мониторинг логов

```bash
# Мониторинг всех сервисов
docker-compose logs -f --tail=100

# Только backend
docker-compose logs -f backend --tail=50

# Только celery
docker-compose logs -f celery --tail=50
```

---

## 🧪 Тестирование на продакшн

### 1. Тест создания статьи

```bash
# Через веб-интерфейс:
# 1. Войдите как администратор
# 2. Перейдите на /articles
# 3. Нажмите "Створити статтю"
# 4. Загрузите обложку
# 5. Создайте статью
# 6. Проверьте, что изображение отображается
```

### 2. Тест модерации форума

```bash
# 1. Создайте новый топик со спамом (например, "ДЕШЕВЫЕ КРЕДИТЫ!!!")
# 2. Должна появиться ошибка модерации
# 3. Проверьте логи:
docker-compose logs backend | grep "AI Moderation"
```

### 3. Тест блокировки пользователя

```bash
# 1. Войдите как пользователь 1
# 2. Откройте топик от пользователя 2
# 3. Нажмите "..." -> "Заблокувати користувача"
# 4. Вернитесь на форум
# 5. Топики пользователя 2 должны исчезнуть
```

### 4. Тест парсеров

```bash
# Запустить парсеры вручную
docker exec -it buhassistant-celery-1 python -c "
from app.celery_app import app as celery_app
from app.tasks.crawlers import crawl_buhplatforma_news, crawl_7eminar_news

print('Running buhplatforma parser...')
crawl_buhplatforma_news()

print('Running 7eminar parser...')
crawl_7eminar_news()
"

# Проверить новости в БД
docker exec -it buhassistant-postgres-1 psql -U eglavbuh_user -d eglavbuh_db -c "
SELECT title, source FROM news WHERE source IN ('buhplatforma.com.ua', '7eminar.ua') ORDER BY published_at DESC LIMIT 5;
"
```

---

## 🔥 Откат в случае проблем

### Если что-то пошло не так:

```bash
# 1. Остановить контейнеры
docker-compose down

# 2. Восстановить БД из бэкапа
docker-compose up -d postgres
docker exec -i buhassistant-postgres-1 psql -U eglavbuh_user eglavbuh_db < /root/backup_YYYYMMDD_HHMMSS.sql

# 3. Откатить код
git reset --hard HEAD~1  # или конкретный коммит
git pull origin main

# 4. Запустить старую версию
docker-compose up -d
```

---

## ✅ Чек-лист перед деплоем

- [ ] Закоммичены все изменения в git
- [ ] Сделан бэкап БД на продакшн
- [ ] Добавлены новые переменные в .env (OPENAI_API_KEY, EXPO_ACCESS_TOKEN)
- [ ] Создана папка `/root/buhassistant/backend/static/uploads`
- [ ] Пересобраны Docker образы
- [ ] Применены миграции (`alembic upgrade head`)
- [ ] Перезапущены Celery воркеры
- [ ] Проверены логи на ошибки
- [ ] Протестированы основные фичи (статьи, модерация, блокировка)

---

## 📞 Поддержка

Если возникнут проблемы:

1. **Проверьте логи:**
   ```bash
   docker-compose logs backend --tail=100
   docker-compose logs celery --tail=100
   ```

2. **Проверьте статус контейнеров:**
   ```bash
   docker-compose ps
   docker stats --no-stream
   ```

3. **Проверьте миграции:**
   ```bash
   docker exec -it buhassistant-backend-1 alembic current
   docker exec -it buhassistant-backend-1 alembic history
   ```

---

**Удачи с деплоем!** 🚀

