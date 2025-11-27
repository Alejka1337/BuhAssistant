# 🚀 Быстрая сборка для тестирования через Xcode

## Способ 1: Через npx expo run:ios (РЕКОМЕНДУЕТСЯ)

```bash
cd /Users/alejka1337/Desktop/buhassistant

# Запустить Metro bundler
npx expo start

# В другом терминале собрать и запустить на устройстве
npx expo run:ios --device
```

Выберите ваш iPhone из списка устройств.

---

## Способ 2: Через Xcode

1. Открыть проект:
```bash
cd /Users/alejka1337/Desktop/buhassistant
open ios/buhassistant.xcworkspace
```

2. В Xcode:
   - Выбрать схему: **buhassistant**
   - Выбрать устройство: **Ваш iPhone**
   - Нажать **⌘ + R** (Run)

3. Если ошибка "No bundle URL present":
   ```bash
   # В терминале запустить Metro
   npx expo start
   ```

---

## После запуска приложения

### 1. Проверить логи в Xcode Console

Должны появиться логи:

**При запуске приложения (checkAuth):**
```
🔐 [AuthContext] Checking authentication...
🔐 [AuthContext] Access token exists: true
🔐 [AuthContext] User data loaded: dmitrjialekseev16@gmail.com
🔐 [AuthContext] User is_verified: true
🔐 [AuthContext] Calling registerPushToken() from checkAuth...
🔔 [AuthContext] Starting push token registration...
🔔 [AuthContext] Calling registerForPushNotificationsAsync()...
🔔 [PushService] Device.isDevice: true
🔔 [PushService] Checking existing permissions...
🔔 [PushService] Existing permission status: granted
🔔 [PushService] Project ID: 8698ae71-7811-4098-ab40-e39b6dcffcf4
🔔 [PushService] Getting Expo Push Token...
✅ [PushService] Push token obtained: ExponentPushToken[XXXXXXXXXXXX]
🔔 [AuthContext] Received push token: ExponentPushToken[XXXXXXXXXXXX]
🔔 [AuthContext] Sending token to backend...
🔔 [PushService] Отправка push токена на бэкенд: ExponentPushToken[XXXXXXXXXXXX]
🔔 [PushService] API endpoint: https://e637d023274f.ngrok-free.app/api/push/register
🔔 [PushService] Response status: 200
🔔 [PushService] Response ok: true
✅ [PushService] Push-токен успешно зарегистрирован: {...}
✅ [AuthContext] Push token registered successfully!
```

**Если что-то не так, увидите:**
```
⚠️ [PushService] Push token registration returned null
❌ [PushService] Ошибка регистрации push токена...
❌ [AuthContext] Failed to send token to backend
```

### 2. Проверить БД

```bash
docker-compose exec backend python -c "
from app.db.database import get_db
from app.models.user import User

db = next(get_db())
user = db.query(User).filter(User.email == 'dmitrjialekseev16@gmail.com').first()
print(f'Push Token: {user.push_token}')
"
```

**Должно быть:**
```
Push Token: ExponentPushToken[XXXXXXXXXXXXXXXXXXXX]
```

### 3. Протестировать отправку уведомления

1. В приложении: **Профіль** → **Сповіщення**
2. Нажать **"Надіслати тестове повідомлення"**
3. Должно прийти push уведомление на iPhone!

---

## Преимущества dev-сборки через Xcode

- ✅ **Моментально** (2-3 минуты вместо 20)
- ✅ **Видны все логи** в реальном времени
- ✅ **Hot reload** для изменений JS/TS
- ✅ **Breakpoints** для отладки
- ✅ **Не тратит билды EAS** (бесплатный план ограничен)

---

## После успешного теста

Когда всё заработает локально, можно собрать финальный Production Build:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

---

## Troubleshooting

### Ошибка: "No bundle URL present"
```bash
# Запустить Metro в отдельном терминале
npx expo start
```

### Ошибка: "Could not find iPhone"
```bash
# Проверить подключенные устройства
xcrun xctrace list devices
```

### Ошибка: "Code signing"
В Xcode:
- Signing & Capabilities → Team → выбрать ваш Apple ID

---

## 🎯 Начинайте с dev-сборки!

Это намного быстрее для отладки! 🚀

