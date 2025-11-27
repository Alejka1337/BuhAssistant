# 🔐 Authentication API Documentation

## ✅ Backend Implementation Status

**Статус**: Backend авторизация полностью реализована!

### Что уже готово:

1. ✅ **Модели БД**: Таблица `users` с полями для авторизации
2. ✅ **JWT утилиты**: Создание и верификация access/refresh токенов
3. ✅ **Password hashing**: Bcrypt для безопасного хранения паролей
4. ✅ **Pydantic схемы**: Валидация данных для register/login
5. ✅ **Auth endpoints**:
   - `POST /api/auth/register` - регистрация
   - `POST /api/auth/login` - вход
   - `POST /api/auth/refresh` - обновление токена
   - `GET /api/auth/me` - получение данных пользователя (protected)
   - `GET /api/auth/health` - health check
6. ✅ **Dependencies**: `get_current_user` для protected endpoints
7. ✅ **Миграции БД**: Таблица users создана

---

## 🧪 Тестирование API

### 1. Health Check

```bash
curl http://localhost:8000/api/auth/health
```

### 2. Регистрация нового пользователя

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

**Ответ:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "full_name": "Test User",
    "user_type": null,
    "fop_group": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2025-11-04T...",
    "last_login": "2025-11-04T..."
  }
}
```

### 3. Вход в систему

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Получение данных пользователя (Protected Endpoint)

```bash
# Замените YOUR_ACCESS_TOKEN на реальный токен из ответа login/register
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Обновление токена

```bash
# Замените YOUR_REFRESH_TOKEN на реальный refresh token
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🔒 JWT Token Configuration

### Настройки в `backend/app/core/config.py`:

- **SECRET_KEY**: `your-secret-key-change-in-production` (⚠️ ИЗМЕНИТЬ в production!)
- **ALGORITHM**: `HS256`
- **ACCESS_TOKEN_EXPIRE_MINUTES**: `30` (30 минут)
- **REFRESH_TOKEN_EXPIRE_DAYS**: `7` (7 дней)

### Структура JWT токена:

```json
{
  "sub": 1,              // user_id
  "type": "access",      // или "refresh"
  "exp": 1699123456      // timestamp истечения
}
```

---

## 🛡️ Protected Endpoints

Для создания protected endpoint используйте dependency `get_current_user`:

```python
from fastapi import Depends
from app.api.deps import get_current_user
from app.models.user import User

@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.email}!"}
```

---

## 📝 Следующие шаги

### Backend:
- ⏳ Добавить Google OAuth2 endpoints
- ⏳ Email verification (опционально)
- ⏳ Password reset flow (опционально)

### Frontend:
- ⏳ Установить `expo-secure-store` для хранения токенов
- ⏳ Создать auth context
- ⏳ Создать экраны Login и Register
- ⏳ Добавить protected routes
- ⏳ Интегрировать Google Sign In

---

## 🚀 Готово к использованию!

Backend авторизация полностью функциональна и готова к тестированию.

**Swagger документация**: http://localhost:8000/api/docs

