# 🔧 Исправление ошибки "aps-environment для приложения не найдены"

## 🐛 Проблема

```
❌ [PushService] Ошибка регистрации push-токена: 
{ [Error: строки авторизации «aps-environment» для приложения не найдены] code: 'ERR_UNEXPECTED' }
```

**Причина:** Provisioning Profile не содержит информацию о Push Notifications capability.

Это происходит, когда:
1. App ID создан БЕЗ Push Notifications capability
2. Provisioning Profile создан до настройки Push Notifications
3. EAS Build использует старый Provisioning Profile

---

## ✅ Решение: Пересоздать Provisioning Profile

### Шаг 1: Проверить App ID в Apple Developer Console

1. Открыть: https://developer.apple.com/account/resources/identifiers/list
2. Найти ваш App ID: `com.alejka1337.eglavbuh.dev`
3. Нажать на него для редактирования
4. **Проверить:** В списке Capabilities должна быть галочка **Push Notifications** ✅
5. Если галочки нет:
   - Поставить галочку **Push Notifications**
   - Нажать **Save**
   - Нажать **Confirm**

---

### Шаг 2: Удалить старый Provisioning Profile в EAS

```bash
cd /Users/alejka1337/Desktop/buhassistant
eas credentials
```

Выберите:
- **iOS**
- **production** (профиль сборки)

В меню выберите:
- **Provisioning Profile** → **Remove Provisioning Profile**

Подтвердите удаление.

---

### Шаг 3: Проверить APNs Key

В том же меню `eas credentials`:
- Проверить, что есть **Apple Push Notifications service key**
- Если нет - создать новый:
  - **Set up Push Notifications** → **Create a new key**

---

### Шаг 4: Пересобрать приложение

```bash
eas build --platform ios --profile production
```

EAS автоматически создаст **НОВЫЙ** Provisioning Profile с поддержкой Push Notifications.

---

### Шаг 5: Submit в TestFlight

```bash
eas submit --platform ios --profile production --latest
```

---

### Шаг 6: Установить и протестировать

1. Открыть TestFlight на iPhone
2. Обновить до нового билда
3. **ВАЖНО:** Удалить приложение перед установкой
4. Установить заново
5. Войти в аккаунт
6. Проверить логи в Xcode Console

---

## 🔍 Проверка после исправления

### Ожидаемые логи в Xcode Console:

```
🔐 [AuthContext] Checking authentication...
🔐 [AuthContext] Calling registerPushToken() from checkAuth...
🔔 [AuthContext] Starting push token registration...
🔔 [PushService] Device.isDevice: true
🔔 [PushService] Checking existing permissions...
🔔 [PushService] Existing permission status: granted
🔔 [PushService] Project ID: 8698ae71-7811-4098-ab40-e39b6dcffcf4
🔔 [PushService] Getting Expo Push Token...
✅ [PushService] Push token obtained: ExponentPushToken[XXXXXXXXXXXXXXXXXXXX]
🔔 [AuthContext] Received push token: ExponentPushToken[...]
🔔 [AuthContext] Sending token to backend...
🔔 [PushService] Отправка push токена на бэкенд: ExponentPushToken[...]
🔔 [PushService] Response status: 200
✅ [PushService] Push-токен успешно зарегистрирован!
```

### Проверить БД:

```bash
docker-compose exec backend python -c "
from app.db.database import get_db
from app.models.user import User

db = next(get_db())
user = db.query(User).filter(User.email == 'dmitrjialekseev16@gmail.com').first()
print(f'Push Token: {user.push_token}')
"
```

**Должно вывести:**
```
Push Token: ExponentPushToken[XXXXXXXXXXXXXXXXXXXX]
```

### Протестировать отправку:

1. **Профіль** → **Сповіщення**
2. **Надіслати тестове повідомлення**
3. Должно прийти push уведомление! 🎉

---

## 📚 Альтернативный метод (через Apple Developer Console)

### 1. Удалить старый Provisioning Profile

1. Открыть: https://developer.apple.com/account/resources/profiles/list
2. Найти профиль для `com.alejka1337.eglavbuh.dev`
3. Выбрать его
4. Нажать **Delete**

### 2. Пересоздать в EAS

```bash
eas credentials
```

Выберите **production** → **Set up a new provisioning profile**

---

## 🐛 Troubleshooting

### Проблема: Ошибка всё ещё появляется

**Проверить:**

1. **App ID имеет Push Notifications capability:**
   - Apple Developer Console → Identifiers → ваш App ID
   - Должна быть галочка **Push Notifications** ✅

2. **APNs Key существует в EAS:**
   ```bash
   eas credentials
   ```
   - iOS → production → должен быть **Apple Push Notifications service key**

3. **Билд создан ПОСЛЕ удаления старого Provisioning Profile:**
   - Удалить старый профиль через `eas credentials`
   - Пересобрать: `eas build --platform ios --profile production`

4. **Приложение установлено из НОВОГО билда:**
   - Удалить старое приложение с iPhone
   - Установить новое через TestFlight

---

## 📖 Документация

- [EAS Build: iOS credentials](https://docs.expo.dev/build/setup/#configure-credentials)
- [Expo: Push Notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Apple: Configuring Push Notifications](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_token-based_connection_to_apns)

---

## ✅ Checklist

- [ ] App ID имеет Push Notifications capability
- [ ] APNs Key создан в EAS
- [ ] Старый Provisioning Profile удален
- [ ] Новый билд создан
- [ ] Новый билд отправлен в TestFlight
- [ ] Приложение удалено с iPhone
- [ ] Новое приложение установлено через TestFlight
- [ ] Логи показывают успешное получение токена
- [ ] Токен сохранен в БД
- [ ] Тестовое уведомление приходит

---

## 🎯 Итог

После выполнения этих шагов ошибка `aps-environment не найдены` исчезнет, и push-уведомления начнут работать! 🚀

