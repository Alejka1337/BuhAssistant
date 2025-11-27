# 🔍 Build #5 - Debug Push Notifications

## Что добавлено

### 1. Детальное логирование (Console)

**В `AuthContext.tsx`:**
- 🔔 `[AuthContext] Starting push token registration...`
- 🔔 `[AuthContext] Calling registerForPushNotificationsAsync()...`
- 🔔 `[AuthContext] Received push token: ...`
- 🔔 `[AuthContext] Sending token to backend...`
- 🔔 `[AuthContext] sendPushTokenToBackend result: ...`
- ✅ `[AuthContext] Push token registered successfully!`
- ❌ `[AuthContext] Failed to send token to backend`

**В `pushNotificationService.ts`:**
- 🔔 `[PushService] Device.isDevice: ...`
- 🔔 `[PushService] Checking existing permissions...`
- 🔔 `[PushService] Existing permission status: ...`
- 🔔 `[PushService] Project ID: ...`
- 🔔 `[PushService] Getting Expo Push Token...`
- ✅ `[PushService] Push token obtained: ...`
- 🔔 `[PushService] Отправка push токена на бэкенд: ...`
- 🔔 `[PushService] API endpoint: ...`
- 🔔 `[PushService] Response status: ...`
- ✅ `[PushService] Push-токен успешно зарегистрирован: ...`

### 2. Визуальные Alert'ы (только в DEV mode)

При входе в аккаунт увидите **3 Alert'а**:

1. **"Debug: Push Token"**
   - `Token: ExponentPushToken[...]` → токен получен ✅
   - `Token is NULL!` → токен НЕ получен ❌

2. **"Debug: Backend Response"**
   - `SUCCESS ✅` → токен отправлен на бэкенд ✅
   - `FAILED ❌` → ошибка отправки ❌

3. **"Debug: Error"** (если произошла ошибка)
   - Текст ошибки

---

## 🏗️ Сборка Build #5

```bash
cd /Users/alejka1337/Desktop/buhassistant
eas build --platform ios --profile production
# Дождаться завершения (~15-20 минут)
eas submit --platform ios --profile production --latest
```

---

## 🧪 Тестирование

### Шаг 1: Установить Build #5

1. Открыть **TestFlight**
2. Обновить **eGlavBuh** до Build #5
3. **ВАЖНО:** Удалить приложение перед установкой (Settings → eGlavBuh → Delete App)

### Шаг 2: Войти и проверить Alert'ы

1. Открыть приложение
2. Войти в аккаунт (`dmitrjialekseev16@gmail.com`)
3. Разрешить уведомления (при запросе)

**Ожидаемые Alert'ы:**

#### Сценарий A: Всё работает ✅
```
Alert 1: "Debug: Push Token"
         "Token: ExponentPushToken[XXXX...]"

Alert 2: "Debug: Backend Response"
         "SUCCESS ✅"
```

#### Сценарий B: Токен не получается ❌
```
Alert 1: "Debug: Push Token"
         "Token is NULL!"
```

#### Сценарий C: Токен получен, но не отправляется ❌
```
Alert 1: "Debug: Push Token"
         "Token: ExponentPushToken[XXXX...]"

Alert 2: "Debug: Backend Response"
         "FAILED ❌"
```

### Шаг 3: Проверить БД

```bash
docker-compose exec backend python -c "
from app.db.database import get_db
from app.models.user import User

db = next(get_db())
user = db.query(User).filter(User.email == 'dmitrjialekseev16@gmail.com').first()
print(f'User: {user.email}')
print(f'Push Token: {user.push_token}')
print(f'Token type: {type(user.push_token).__name__}')
"
```

**Если всё OK:**
```
User: dmitrjialekseev16@gmail.com
Push Token: ExponentPushToken[XXXXXXXXXXXXXXXXXXXX]
Token type: str
```

### Шаг 4: Проверить логи бэкенда

```bash
docker-compose logs -f backend | grep -i "push"
```

**Ожидаемое:**
```
POST /api/push/register HTTP/1.1" 200 OK
Push token registered for user 2
```

---

## 🔍 Диагностика по результатам

### Сценарий A: "Token is NULL!"

**Проблема:** Expo не может получить push токен.

**Возможные причины:**
1. ❌ APNs Key не настроен в EAS
2. ❌ Project ID неправильный
3. ❌ Разрешения не даны
4. ❌ Проблема с Apple Developer Account

**Проверить:**
```bash
eas credentials -p ios
```

Должен быть **Apple Push Notifications service key**.

**Project ID в app.json:**
```json
"extra": {
  "eas": {
    "projectId": "8698ae71-7811-4098-ab40-e39b6dcffcf4"
  }
}
```

---

### Сценарий B: "SUCCESS ✅" но токена нет в БД

**Проблема:** Бэкенд возвращает 200 OK, но не сохраняет токен.

**Проверить логи бэкенда:**
```bash
docker-compose logs backend | tail -50
```

Должно быть:
```
Push token registered for user 2
```

Если нет → проблема в `/api/push/register` endpoint.

**Проверить код:**

```python
# backend/app/api/push.py
@router.post("/register", response_model=NotificationResponse)
def register_push_token(
    token_data: PushTokenRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.push_token = token_data.push_token
    db.commit()
    ...
```

---

### Сценарий C: "FAILED ❌"

**Проблема:** Ошибка при отправке на бэкенд.

**Проверить логи фронтенда (Xcode Console):**

Должно быть:
```
❌ [PushService] Ошибка регистрации push токена. Status: 401 Response: ...
```

**Возможные причины:**
1. ❌ `authenticatedFetch` не работает
2. ❌ Токен авторизации устарел
3. ❌ Проблема с ngrok URL

**Проверить API URL:**
```typescript
// constants/api.ts
export const API_URL = Constants.expoConfig?.extra?.apiUrl || '...';
```

---

## 📊 Что делать дальше

### Если всё работает ✅

1. Удалить debug Alert'ы из кода
2. Оставить логирование (это полезно)
3. Собрать финальный Build #6
4. Протестировать тестовое уведомление

### Если не работает ❌

1. **Скопировать Alert'ы** (скриншот или текст)
2. **Скопировать логи бэкенда:**
   ```bash
   docker-compose logs backend | tail -100 > backend_logs.txt
   ```
3. **Проверить Xcode Console** (если возможно)
4. Отправить информацию для дальнейшей диагностики

---

## 🚀 Команды для быстрого запуска

```bash
# Сборка
eas build --platform ios --profile production

# Submit
eas submit --platform ios --profile production --latest

# Проверка БД
docker-compose exec backend python -c "from app.db.database import get_db; from app.models.user import User; db = next(get_db()); user = db.query(User).filter(User.id == 2).first(); print(f'Push Token: {user.push_token}')"

# Логи бэкенда
docker-compose logs -f backend | grep -i "push"
```

---

## ✅ Checklist

- [ ] Build #5 собран
- [ ] Build #5 отправлен в TestFlight
- [ ] Приложение удалено и установлено заново
- [ ] Вход выполнен
- [ ] Разрешения на уведомления даны
- [ ] Alert'ы появились
- [ ] Результаты Alert'ов записаны
- [ ] БД проверена
- [ ] Логи бэкенда проверены

---

## 🎯 Цель

После Build #5 мы точно поймём, где именно происходит проблема:
- Токен не получается?
- Токен не отправляется?
- Токен не сохраняется?

И сможем прицельно исправить! 🎉

