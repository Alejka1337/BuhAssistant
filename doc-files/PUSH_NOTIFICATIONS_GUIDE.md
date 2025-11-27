# Руководство по Push-уведомлениям

## Обзор системы

Реализована полная система персонализированных push-уведомлений с использованием:
- **Backend**: FastAPI + Celery + Expo Push Notification Service
- **Frontend**: React Native + expo-notifications
- **Персонализация**: OpenAI API для выбора релевантных новостей

---

## Архитектура

### Backend

1. **Модели БД**:
   - `NotificationSettings` - настройки уведомлений пользователя
   - Расширенная модель `User` с полями `push_token` и связью с `NotificationSettings`

2. **API Endpoints**:
   - `POST /api/push/register` - регистрация push-токена
   - `GET /api/push/settings` - получить настройки уведомлений
   - `PUT /api/push/settings` - обновить настройки уведомлений
   - `POST /api/push/test` - отправить тестовое уведомление
   - `DELETE /api/push/token` - удалить push-токен (при logout)

3. **Celery Tasks**:
   - `send_deadline_notifications` - отправка уведомлений о дедлайнах (каждый день в 9:00)
   - `send_news_notifications` - отправка персонализированных новостей (Пн и Чт в 10:00)

4. **Services**:
   - `PushNotificationService` - отправка через Expo Push API
   - `NewsPersonalizationService` - выбор релевантных новостей через OpenAI

### Frontend

1. **Регистрация токена**: Автоматически при логине и проверке авторизации
2. **Обработка уведомлений**: `NotificationHandler` компонент в root layout
3. **Настройки**: Модальное окно в профиле пользователя

---

## Настройка перед тестированием

### 1. Backend

```bash
cd backend

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
alembic upgrade head

# Убедиться, что переменные окружения настроены
# .env файл должен содержать:
# OPENAI_API_KEY=ваш_ключ
# REDIS_URL=redis://localhost:6379
# DATABASE_URL=postgresql://...
```

### 2. Frontend

```bash
# Установить зависимости
npm install

# Убедиться, что установлены:
# - expo-notifications
# - expo-device
# - expo-constants
```

### 3. Expo Configuration

Добавить в `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#00bfa5",
          "sounds": [
            "./assets/sounds/notification.wav"
          ]
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "ваш_project_id"
      }
    },
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ]
      }
    }
  }
}
```

---

## Тестирование

### Шаг 1: Запуск Backend

```bash
# Terminal 1: FastAPI
cd backend
uvicorn app.main:app --reload

# Terminal 2: Celery Worker
celery -A app.celery_app worker --loglevel=info -Q notifications,crawler,default

# Terminal 3: Celery Beat (для периодических задач)
celery -A app.celery_app beat --loglevel=info
```

### Шаг 2: Запуск Frontend

```bash
# Для физического устройства (iOS)
npx expo run:ios --device

# Для физического устройства (Android)
npx expo run:android --device

# ⚠️ Push-уведомления НЕ работают на симуляторах!
```

### Шаг 3: Тестирование регистрации токена

1. Откройте приложение
2. Войдите в систему (или зарегистрируйтесь)
3. При первом входе должен появиться запрос на разрешение уведомлений
4. Проверьте логи:
   ```
   Push token: ExponentPushToken[...]
   Push-токен успешно зарегистрирован на сервере
   ```

### Шаг 4: Тестирование через UI

1. Перейдите в **Профіль**
2. Нажмите **Сповіщення**
3. В модальном окне:
   - Включите/выключите "Нагадування про дедлайни"
   - Включите/выключите "Персоналізовані новини"
   - Нажмите **"Надіслати тестове повідомлення"**
4. Через несколько секунд должно прийти тестовое уведомление

### Шаг 5: Тестирование через Swagger

1. Откройте http://localhost:8000/api/docs
2. Авторизуйтесь (получите access token)
3. Протестируйте endpoints:
   - `POST /api/push/test` - отправка тестового уведомления
   - `GET /api/push/settings` - получение настроек
   - `PUT /api/push/settings` - изменение настроек

### Шаг 6: Тестирование Celery Tasks вручную

```python
# В Python console или Django shell
from app.tasks.notification_tasks import send_deadline_notifications, send_news_notifications

# Отправить уведомления о дедлайнах
result = send_deadline_notifications.delay()
print(result.get())

# Отправить уведомления о новостях
result = send_news_notifications.delay()
print(result.get())
```

---

## Логика работы

### 1. Уведомления о дедлайнах

- **Расписание**: Каждый день в 9:00 (Киев)
- **Логика**:
  1. Проверяет даты через 1 и 3 дня от текущей
  2. Загружает календарь из JSON файлов
  3. Если на эти даты есть отчеты, берет первый из списка
  4. Отправляет уведомления пользователям с включенной настройкой
- **Фильтрация**: По настройкам `deadline_days_before` пользователя

### 2. Уведомления о новостях

- **Расписание**: Понедельник и четверг в 10:00 (Киев)
- **Логика**:
  1. Получает новости за последнюю неделю
  2. Фильтрует по `target_audience` на основе `user_type`
  3. Использует OpenAI для выбора наиболее релевантной новости
  4. Отправляет персонализированные уведомления
- **Персонализация**: Учитывается `user_type`, `fop_group`, `tax_system`

---

## Troubleshooting

### Уведомления не приходят

1. **Проверьте разрешения**:
   - iOS: Settings > App > Notifications
   - Android: Settings > Apps > App > Notifications

2. **Проверьте регистрацию токена**:
   ```bash
   # В базе данных
   SELECT email, push_token FROM users WHERE email = 'ваш@email.com';
   ```

3. **Проверьте логи Celery**:
   ```bash
   # Должны быть строки вида:
   # Push notification sent successfully to ExponentPushToken[...]
   ```

4. **Проверьте Expo Push Token**:
   - Токен должен начинаться с `ExponentPushToken[`
   - Если токен `null`, значит разрешение не предоставлено

### Celery tasks не запускаются

1. **Проверьте Redis**:
   ```bash
   redis-cli ping
   # Должно вернуть: PONG
   ```

2. **Проверьте Celery Beat**:
   ```bash
   celery -A app.celery_app inspect scheduled
   ```

3. **Проверьте таймзону**:
   - Убедитесь, что `timezone='Europe/Kyiv'` в `celery_app.py`

### OpenAI не работает

1. **Проверьте API key**:
   ```bash
   echo $OPENAI_API_KEY
   ```

2. **Фоллбек**: Если OpenAI недоступен, система автоматически вернет первые N новостей

---

## Структура файлов

### Backend
```
backend/
├── app/
│   ├── models/
│   │   ├── notification.py          # Модель NotificationSettings
│   │   └── user.py                   # Расширенная модель User
│   ├── schemas/
│   │   └── notification.py           # Pydantic схемы
│   ├── api/
│   │   └── push.py                   # API endpoints
│   ├── services/
│   │   ├── push_notification.py      # PushNotificationService
│   │   └── news_personalization.py   # NewsPersonalizationService
│   ├── tasks/
│   │   └── notification_tasks.py     # Celery tasks
│   └── celery_app.py                 # Celery configuration
└── migrations/
    └── versions/
        └── 2025_11_17_0000-add_notification_settings.py
```

### Frontend
```
app/
├── (tabs)/
│   └── profile.tsx                   # Настройки уведомлений
├── _layout.tsx                       # NotificationHandler
├── components/
│   └── NotificationHandler.tsx       # Обработка уведомлений
├── utils/
│   └── pushNotificationService.ts    # Service для push
└── contexts/
    └── AuthContext.tsx               # Регистрация токена при логине
```

---

## Что дальше

- [ ] Добавить статистику отправленных уведомлений в БД
- [ ] Реализовать rich notifications с изображениями
- [ ] Добавить группировку уведомлений
- [ ] Реализовать action buttons в уведомлениях
- [ ] Добавить deep linking для навигации по приложению

---

## Полезные ссылки

- [Expo Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Celery Documentation](https://docs.celeryproject.org/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

