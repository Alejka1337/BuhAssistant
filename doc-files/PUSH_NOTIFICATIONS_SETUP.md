# 📱 Настройка Push-уведомлений для iOS

## ✅ Что уже готово:

- ✅ Apple Developer Account (активен)
- ✅ Backend с Expo Push Notifications SDK
- ✅ Frontend с регистрацией push-токенов
- ✅ Celery tasks для отправки уведомлений

## 🔐 Шаг 1: Настройка в Apple Developer Console

### 1.1. Включить Push Notifications для App ID

1. Перейдите: https://developer.apple.com/account/resources/identifiers/list
2. Найдите ваш **App Identifier** (Bundle ID)
3. Кликните на него → **Edit**
4. В секции **Capabilities** найдите **Push Notifications**
5. ✅ Включите **Push Notifications**
6. Нажмите **Save**

### 1.2. Создать APNs Authentication Key

1. Перейдите: https://developer.apple.com/account/resources/authkeys/list
2. Нажмите **+** (Create a Key)
3. Введите имя: **eGlavBuh Push Notifications**
4. ✅ Включите **Apple Push Notifications service (APNs)**
5. Нажмите **Continue** → **Register**
6. **⚠️ ВАЖНО**: Скачайте `.p8` файл (можно скачать только 1 раз!)
7. Запишите:
   - **Key ID**: `ABC123XYZ` (пример)
   - **Team ID**: найдите в правом верхнем углу консоли (рядом с вашим именем)

**Пример**:
```
Key ID: 9KL8M7N6P5
Team ID: 4Q3R2S1T0U
File: AuthKey_9KL8M7N6P5.p8
```

---

## 🛠️ Шаг 2: Настройка Expo для Production Push

### 2.1. Сохраните APNs Key в проекте (временно для тестирования)

```bash
# В корне проекта создайте папку для ключей (НЕ коммитьте в git!)
mkdir -p .expo-credentials
mv ~/Downloads/AuthKey_XXXXXXXXXX.p8 .expo-credentials/
```

### 2.2. Обновите `app.json` с APNs credentials

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.eglavbuh",
      "config": {
        "usesApns": true
      }
    },
    "notification": {
      "iosDisplayInForeground": true
    }
  }
}
```

### 2.3. Создайте Production билд с EAS

```bash
# Установите EAS CLI (если еще нет)
npm install -g eas-cli

# Войдите в Expo аккаунт
eas login

# Настройте проект для EAS
eas build:configure

# Создайте production билд для iOS
eas build --platform ios --profile production
```

**Во время билда EAS спросит**:
- ✅ Would you like to automatically create an App Store Connect API Key? → **Yes**
- ✅ Team ID: введите ваш Team ID
- ✅ Key ID: введите Key ID вашего APNs ключа
- ✅ Key file path: путь к `.p8` файлу

---

## 📲 Шаг 3: Установка и тестирование

### 3.1. Скачайте билд на iPhone

После успешного билда EAS предоставит ссылку на `.ipa` файл.

**Установка через TestFlight** (рекомендуется):
```bash
# Отправьте билд в TestFlight
eas submit --platform ios --profile production
```

Затем:
1. Откройте TestFlight на iPhone
2. Найдите "eGlavBuh"
3. Установите приложение

**Или установка напрямую** (для тестирования):
1. Скачайте `.ipa` файл по ссылке от EAS
2. Используйте Xcode для установки на устройство

### 3.2. Проверьте регистрацию Push-токена

1. Откройте приложение на iPhone
2. Разрешите уведомления (должен появиться системный диалог)
3. Проверьте консоль бэкенда - должен быть лог:
   ```
   User registered push token: ExponentPushToken[xxxxxxxxxxxxxx]
   ```

---

## 🧪 Шаг 4: Тестирование уведомлений

### 4.1. Тест через профиль приложения

1. Откройте приложение → **Профіль** → **Сповіщення**
2. Включите оба типа уведомлений:
   - ✅ Нагадування про дедлайни
   - ✅ Персоналізовані новини
3. Нажмите **Надіслати тестове повідомлення**
4. Через 5-10 секунд должно прийти push-уведомление

### 4.2. Проверьте логи бэкенда

```bash
# В терминале с Docker:
docker-compose logs -f celery_worker | grep -i push

# Должны увидеть:
# ✅ Sent push notification to user 123
# ✅ Successfully sent 1 push notifications
```

### 4.3. Тест через Celery задачи

**Deadline уведомления** (тестируются за 1 и 3 дня до дедлайна):
```bash
# Запустите задачу вручную:
docker-compose exec web python -c "from app.tasks.notification_tasks import send_deadline_notifications_task; send_deadline_notifications_task.delay()"
```

**News уведомления** (дважды в неделю: понедельник, четверг):
```bash
# Запустите задачу вручную:
docker-compose exec web python -c "from app.tasks.notification_tasks import send_personalized_news_task; send_personalized_news_task.delay()"
```

---

## 🐛 Troubleshooting

### Проблема 1: Push не приходят

**Проверьте**:
1. ✅ Push Notifications включены в App Identifier (Apple Developer Console)
2. ✅ APNs Key создан и правильно настроен в EAS
3. ✅ Билд создан через EAS (не через Xcode локально)
4. ✅ Пользователь разрешил уведомления в iOS
5. ✅ Push-токен зарегистрирован в БД

**Логи**:
```bash
# Backend:
docker-compose logs -f web | grep -i push

# Celery:
docker-compose logs -f celery_worker | grep -i push
```

### Проблема 2: "Push token is not a valid Expo push token"

**Причина**: Билд был создан через Xcode, а не через EAS.

**Решение**: Создайте билд через EAS:
```bash
eas build --platform ios --profile production
```

### Проблема 3: APNs Key не работает

**Проверьте**:
1. Key ID правильный
2. Team ID правильный
3. `.p8` файл не поврежден
4. Key не был отозван в Apple Developer Console

---

## 📋 Checklist перед запуском в production

- [ ] Push Notifications включены для App ID
- [ ] APNs Key создан и сохранен
- [ ] EAS билд создан успешно
- [ ] Приложение установлено на iPhone через TestFlight
- [ ] Пользователь разрешил уведомления
- [ ] Тестовое уведомление получено
- [ ] Deadline уведомления работают
- [ ] News уведомления работают
- [ ] Логи показывают успешную отправку

---

## 🚀 Запуск в production

### 1. Настройте переменные окружения (если используете APNs напрямую)

Если вы НЕ используете Expo Push Service, а APNs напрямую:

```env
# .env
APNS_KEY_ID=9KL8M7N6P5
APNS_TEAM_ID=4Q3R2S1T0U
APNS_KEY_PATH=/path/to/AuthKey_9KL8M7N6P5.p8
```

### 2. Настройте Celery Beat для периодических уведомлений

Уже настроено в `app/celery_app.py`:
```python
# Deadline уведомления - каждый день в 09:00
'check-deadlines': {
    'task': 'app.tasks.notification_tasks.send_deadline_notifications_task',
    'schedule': crontab(hour=9, minute=0),
},

# News уведомления - понедельник и четверг в 10:00
'send-news': {
    'task': 'app.tasks.notification_tasks.send_personalized_news_task',
    'schedule': crontab(day_of_week='1,4', hour=10, minute=0),
},
```

### 3. Мониторинг

Настройте логирование и мониторинг:
```bash
# Проверяйте логи регулярно:
docker-compose logs -f celery_worker | grep -E "(push|notification)"
```

---

## 📚 Полезные ссылки

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Apple Developer - APNs](https://developer.apple.com/documentation/usernotifications)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [TestFlight](https://developer.apple.com/testflight/)

---

## ✅ Готово!

После выполнения всех шагов push-уведомления будут работать на вашем iPhone! 🎉📱

