# Этап 4: Роль модератора - Завершено

## Обзор

Реализован функционал для модераторов и администраторов для управления контентом и пользователями в соответствии с Apple App Store Guidelines 1.2 (требование 5).

## Backend - Выполненные изменения

### 1. Модель User обновлена

**Файл:** `backend/app/models/user.py`

Добавлен enum `UserRole` и поле `role`:

```python
class UserRole(str, enum.Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class User(Base):
    # ...existing fields
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
```

### 2. Миграция Alembic

**Файл:** `backend/migrations/versions/2025_12_03_1240-2625d5d03b87_add_role_to_users.py`

- ✅ Создан enum тип `userrole` в PostgreSQL
- ✅ Добавлена колонка `role` с дефолтным значением `'user'`
- ✅ Миграция применена успешно

### 3. Dependencies для проверки ролей

**Файл:** `backend/app/core/deps.py` (новый)

Созданы две зависимости:

#### `get_current_moderator()`
- Проверяет что пользователь имеет роль `moderator` или `admin`
- Возвращает 403 Forbidden если роли недостаточно
- Используется для endpoints модерации

#### `get_current_admin()`
- Проверяет что пользователь имеет роль `admin`
- Возвращает 403 Forbidden если не admin
- Для будущих админ-функций

### 4. API Endpoints для жалоб (обновлено)

**Файл:** `backend/app/api/reports.py`

#### Новые endpoints для модераторов:

**GET /api/reports**
- Получить все жалобы (с фильтрацией по статусу)
- Параметры: `status_filter`, `limit`, `offset`
- Доступ: moderator или admin

**PATCH /api/reports/{report_id}/review**
- Обработать жалобу
- Actions: `dismiss` (отклонить) или `accept` (принять)
- Устанавливает `reviewed_at` и `reviewed_by_id`
- Доступ: moderator или admin

**DELETE /api/reports/{report_id}**
- Удалить жалобу
- Доступ: moderator или admin

### 5. API Endpoints для модерации контента

**Файл:** `backend/app/api/forum.py`

#### DELETE /api/forum/threads/{thread_id}/moderate
- Удалить топик
- Опция: `ban_user` (забанить автора топика)
- Cascade удаление всех комментариев
- Доступ: moderator или admin

#### DELETE /api/forum/posts/{post_id}/moderate
- Удалить комментарий
- Опция: `ban_user` (забанить автора комментария)
- Cascade удаление вложенных ответов
- Доступ: moderator или admin

#### POST /api/forum/users/{user_id}/ban
- Забанить пользователя (is_active = False)
- Нельзя забанить себя
- Доступ: moderator или admin

#### POST /api/forum/users/{user_id}/unban
- Разбанить пользователя (is_active = True)
- Доступ: moderator или admin

### 6. Схемы обновлены

**Файл:** `backend/app/schemas/auth.py`

Добавлено поле `role` в `UserResponse`:

```python
class UserResponse(BaseModel):
    # ...existing fields
    role: str = "user"  # user, moderator, admin
```

## Структура ролей

### User (по умолчанию)
- Создание контента
- Жалобы на контент
- Блокировка пользователей
- Просмотр своих жалоб

### Moderator
- Всё что может User
- Просмотр всех жалоб
- Обработка жалоб (принять/отклонить)
- Удаление контента (топики, комментарии)
- Бан/разбан пользователей

### Admin
- Всё что может Moderator
- Управление ролями пользователей (в будущем)
- Полный доступ к системе

## API Endpoints Summary

### Для пользователей:
```
POST   /api/reports              - Создать жалобу
GET    /api/reports/my           - Мои жалобы

POST   /api/blocks               - Заблокировать пользователя
DELETE /api/blocks/{user_id}     - Разблокировать
GET    /api/blocks               - Список заблокированных
```

### Для модераторов:
```
GET    /api/reports              - Все жалобы (с фильтрами)
PATCH  /api/reports/{id}/review  - Обработать жалобу
DELETE /api/reports/{id}         - Удалить жалобу

DELETE /api/forum/threads/{id}/moderate  - Удалить топик
DELETE /api/forum/posts/{id}/moderate    - Удалить комментарий
POST   /api/forum/users/{id}/ban         - Забанить пользователя
POST   /api/forum/users/{id}/unban       - Разбанить пользователя
```

## Как назначить модератора

### Через psql:

```bash
# Подключиться к базе
docker exec eglavbuh_postgres psql -U eglavbuh_user -d eglavbuh_db

# Назначить модератором
UPDATE users SET role = 'moderator' WHERE email = 'moderator@example.com';

# Назначить админом
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

# Проверить
SELECT id, email, role FROM users WHERE role != 'user';
```

### Или через SQL файл:

```sql
-- Назначить первого администратора
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Frontend (веб-версия)

Для админ-панели модератора потребуется создать:

### 1. Веб-интерфейс для модераторов

**Примерная структура:**

```
/admin/
  /reports/          - Список жалоб
    [id]/            - Детали жалобы
  /users/            - Управление пользователями
  /content/          - Модерация контента
```

### 2. Компоненты для веб-версии

- `ReportsList.tsx` - Таблица жалоб с фильтрами
- `ReportDetail.tsx` - Детали жалобы с действиями
- `UserManagement.tsx` - Список пользователей с баном
- `ContentModeration.tsx` - Быстрый доступ к контенту

### 3. Защита роутов

Проверка роли в `AuthContext`:

```typescript
const isModerator = user?.role === 'moderator' || user?.role === 'admin';

if (!isModerator) {
  // Redirect to home или 403
}
```

## Тестирование

### 1. Создать тестового модератора

```bash
docker exec eglavbuh_postgres psql -U eglavbuh_user -d eglavbuh_db \
  -c "UPDATE users SET role = 'moderator' WHERE email = 'test@test.com';"
```

### 2. Проверить endpoints через curl

```bash
# Получить токен модератора
TOKEN="moderator_access_token"

# Получить все жалобы
curl https://90a8375ea3d8.ngrok-free.app/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "ngrok-skip-browser-warning: true"

# Обработать жалобу
curl -X PATCH https://90a8375ea3d8.ngrok-free.app/api/reports/1/review?action=dismiss \
  -H "Authorization: Bearer $TOKEN" \
  -H "ngrok-skip-browser-warning: true"

# Удалить топик
curl -X DELETE https://90a8375ea3d8.ngrok-free.app/api/forum/threads/1/moderate \
  -H "Authorization: Bearer $TOKEN" \
  -H "ngrok-skip-browser-warning: true"

# Забанить пользователя
curl -X POST https://90a8375ea3d8.ngrok-free.app/api/forum/users/5/ban \
  -H "Authorization: Bearer $TOKEN" \
  -H "ngrok-skip-browser-warning: true"
```

## Логирование

Все действия модераторов логируются:

```python
logger.info(f"Moderator {moderator.id} deleted thread {thread_id}")
logger.warning(f"Moderator {moderator.id} banned user {user_id}")
```

Логи можно просматривать:

```bash
docker-compose logs backend | grep "Moderator"
```

## Безопасность

1. ✅ Все endpoints требуют авторизации
2. ✅ Проверка роли через dependency
3. ✅ Модератор не может забанить себя
4. ✅ Все действия логируются
5. ✅ Cascade удаление связанного контента

## Следующие шаги

### Для полного соответствия Apple Guidelines:

1. ✅ Создать тестового модератора
2. ⏳ Разработать веб-админ-панель
3. ⏳ Добавить email уведомления для модераторов
4. ⏳ Dashboard со статистикой жалоб

### Опционально:

- Автоматическая модерация (AI)
- История действий модератора
- Права для разных уровней модераторов
- Временные баны (с датой разбана)

## Статус

✅ **Backend полностью готов**  
⏳ **Веб-админ-панель** (следующий этап)  
✅ **Готово к деплою на production**

---
**Дата:** 3 декабря 2025  
**Версия:** 1.0  
**Статус:** Этап 4 завершён

