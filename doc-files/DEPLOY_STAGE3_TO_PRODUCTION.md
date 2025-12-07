# Deploy Stage 3 (Reports & Blocks) на Production

## Проблема
При тестировании получаем ошибки 404:
- `POST /api/reports` → 404 Not Found
- `POST /api/blocks` → 404 Not Found

Это означает, что на production сервере еще не применены изменения из Этапа 3.

## Что нужно сделать

### 1. Подключиться к серверу

```bash
ssh user@api.eglavbuh.com.ua
# или
ssh user@<IP-адрес-сервера>
```

### 2. Перейти в директорию проекта

```bash
cd /path/to/buhassistant/backend
```

### 3. Применить миграции Alembic

```bash
# Перейти в контейнер backend (если используете Docker)
docker exec -it eglavbuh_backend bash

# Или если backend запущен без Docker:
cd /path/to/backend

# Применить миграции
alembic upgrade head

# Проверить что миграции применились
alembic current
```

**Ожидаемая миграция:**
- `2025_12_02_1903-4461b8a0667e_add_content_reports_and_user_blocks_.py`

Эта миграция создаёт таблицы:
- `content_reports`
- `user_blocks`

### 4. Загрузить новый код на сервер

Если код еще не загружен:

```bash
# На локальной машине
git add .
git commit -m "Add complaints and blocking functionality (Stage 3)"
git push origin main

# На сервере
cd /path/to/buhassistant
git pull origin main
```

### 5. Перезапустить backend

#### Если используете Docker:

```bash
cd /path/to/buhassistant/backend
docker-compose restart backend

# Проверить логи
docker-compose logs -f backend
```

#### Если без Docker:

```bash
# Используя systemd
sudo systemctl restart buhassistant-backend

# Или если используете supervisor
sudo supervisorctl restart buhassistant-backend

# Проверить статус
sudo systemctl status buhassistant-backend
```

### 6. Проверить что endpoints работают

```bash
# Получить access token (замените на реальные данные)
TOKEN="your_access_token"

# Проверить endpoint Reports
curl -X POST https://api.eglavbuh.com.ua/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "content_type": "thread",
    "content_id": 1,
    "reported_user_id": 2,
    "reason": "spam",
    "details": "Test"
  }'

# Проверить endpoint Blocks
curl -X POST https://api.eglavbuh.com.ua/api/blocks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"blocked_id": 2}'

# Получить список блокировок
curl https://api.eglavbuh.com.ua/api/blocks \
  -H "Authorization: Bearer $TOKEN" \
  -H "ngrok-skip-browser-warning: true"
```

### 7. Проверить базу данных (опционально)

```bash
# Подключиться к PostgreSQL
docker exec -it eglavbuh_postgres psql -U eglavbuh_user -d eglavbuh_db

# Проверить таблицы
\dt

# Должны появиться:
# content_reports
# user_blocks

# Проверить структуру
\d content_reports
\d user_blocks

# Выйти
\q
```

## Чеклист деплоя

- [ ] Подключился к серверу
- [ ] Загрузил новый код (git pull)
- [ ] Применил миграции (alembic upgrade head)
- [ ] Перезапустил backend
- [ ] Проверил логи - нет ошибок
- [ ] Проверил endpoint /api/reports через curl
- [ ] Проверил endpoint /api/blocks через curl
- [ ] Проверил таблицы в БД созданы
- [ ] Протестировал из приложения

## Быстрая команда для Docker

Если всё настроено через Docker Compose:

```bash
# На сервере
cd /path/to/buhassistant
git pull origin main
cd backend
docker-compose exec backend alembic upgrade head
docker-compose restart backend
docker-compose logs -f backend
```

## Важные файлы на сервере

Проверьте что обновлены:
- `backend/app/api/reports.py` - новый файл
- `backend/app/api/blocks.py` - новый файл
- `backend/app/models/report.py` - новый файл
- `backend/app/schemas/report.py` - новый файл
- `backend/app/main.py` - обновлён (добавлены router'ы)
- `backend/migrations/versions/2025_12_02_1903-*.py` - новая миграция

## Если миграция не применяется

Возможные проблемы:

1. **Конфликт версий:**
   ```bash
   alembic current
   alembic history
   ```

2. **Таблицы уже существуют:**
   ```bash
   # Проверить
   docker exec -it eglavbuh_postgres psql -U eglavbuh_user -d eglavbuh_db -c "\dt"
   ```

3. **Ошибка в миграции:**
   ```bash
   docker-compose logs backend | grep -i error
   ```

## После успешного деплоя

1. ✅ Endpoints /api/reports и /api/blocks работают
2. ✅ В приложении можно пожаловаться на контент
3. ✅ В приложении можно заблокировать пользователя
4. ✅ В профиле можно увидеть заблокированных пользователей

---
**Статус:** Готово к деплою  
**Дата:** 2 декабря 2025

