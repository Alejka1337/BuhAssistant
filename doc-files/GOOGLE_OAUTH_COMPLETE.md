# ✅ Google OAuth2 - Полная реализация

## 🎉 Что готово:

### Backend:
- ✅ Google OAuth utilities (`backend/app/core/google_auth.py`)
- ✅ Pydantic схемы (`backend/app/schemas/google_auth.py`)
- ✅ Endpoint `POST /api/auth/google` - авторизация через Google ID token
- ✅ Endpoint `GET /api/auth/google/url` - получение Google auth URL (для web)
- ✅ Автоматическое создание пользователя при первом входе через Google
- ✅ Поддержка существующих пользователей (связывание по email)

### Frontend:
- ✅ **expo-auth-session** интегрирован (официальное Expo решение, вместо `@react-native-google-signin/google-signin`)
- ✅ Компонент `GoogleSignInButton` (`components/GoogleSignInButton.tsx`)
- ✅ Интеграция в `authService.ts` и `AuthContext`
- ✅ Кнопка "Увійти через Google" на экране Login
- ✅ Настройка в `app.json`

> **⚠️ Изменение:** Изначально планировался `@react-native-google-signin/google-signin`, но он вызывал ошибки TurboModuleRegistry. Переключились на `expo-auth-session` - официальное решение от Expo, которое проще в настройке и работает из коробки.

---

## 🔧 Настройка (что нужно сделать СЕЙЧАС)

### Шаг 1: Извлечение Client IDs из файлов

У вас есть 2 файла:

**1. Web credentials (для backend):**
`client_secret_914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com.json`

Откройте его и найдите:
```json
{
  "web": {
    "client_id": "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com",
    "client_secret": "GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**2. iOS credentials (для frontend):**
`client_914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com.plist`

Откройте его и найдите:
```xml
<key>CLIENT_ID</key>
<string>914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com</string>
```

---

### Шаг 2: Настройка Backend

Создайте файл `backend/.env` (скопируйте из `backend/env.example`):

```bash
cd /Users/alejka1337/Desktop/buhassistant/backend
cp env.example .env
```

Откройте `backend/.env` и замените:

```bash
# Google OAuth2
GOOGLE_CLIENT_ID=914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx  # ⚠️ Замените на реальный!
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

---

### Шаг 3: Перезапуск Backend

```bash
cd /Users/alejka1337/Desktop/buhassistant/backend
docker-compose restart backend
```

Проверьте, что backend запустился без ошибок:

```bash
docker-compose logs backend --tail=20
```

---

### Шаг 4: Проверка Frontend настройки

Файл `app.json` уже обновлен с вашими Client IDs:

```json
{
  "extra": {
    "googleWebClientId": "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com",
    "googleIosClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com"
  }
}
```

✅ Это уже готово!

---

### Шаг 5: Пересборка iOS приложения

Google Sign In требует нативной сборки:

```bash
cd /Users/alejka1337/Desktop/buhassistant

# Пересоздать нативные файлы
npx expo prebuild --clean

# Запустить iOS симулятор
npx expo run:ios
```

---

## 🧪 Тестирование

### 1. Проверка Backend endpoint:

```bash
curl http://localhost:8000/api/auth/health
```

Должно быть:
```json
{
  "status": "healthy",
  "endpoints": {
    ...
    "google": "POST /api/auth/google (Google OAuth2)",
    "google_url": "GET /api/auth/google/url (Get auth URL)"
  }
}
```

### 2. Тест на iOS симуляторе:

1. Запустите приложение (`npx expo run:ios`)
2. Перейдите на экран Login
3. Нажмите кнопку "Увійти через Google" (синяя кнопка)
4. Выберите Google аккаунт
5. Подтвердите доступ

**Ожидаемый результат:**
- ✅ Успешный вход
- ✅ Автоматический переход на главную страницу
- ✅ Профиль показывает данные пользователя
- ✅ Пользователь создан в БД (с `google_id`)

### 3. Проверка в БД:

```bash
docker-compose exec postgres psql -U buhassistant -d buhassistant_db -c "SELECT id, email, full_name, google_id, is_verified FROM users;"
```

Должны увидеть пользователя с заполненным `google_id` и `is_verified=true`.

---

## 🔍 Архитектура Google OAuth Flow

### Мобильное приложение (iOS):

```
1. User нажимает "Увійти через Google"
2. Google Sign In SDK открывает Google login page
3. User выбирает аккаунт и подтверждает
4. SDK возвращает Google ID token
5. Frontend отправляет token на POST /api/auth/google
6. Backend верифицирует token через Google API
7. Backend создает/обновляет пользователя в БД
8. Backend возвращает JWT access/refresh tokens
9. Frontend сохраняет токены в SecureStore
10. User авторизован!
```

### Преимущества:

- ✅ **Безопасность**: Backend верифицирует Google token
- ✅ **Единый flow**: Один endpoint для mobile и web
- ✅ **Нет пароля**: Google уже верифицировал пользователя
- ✅ **is_verified=true**: Email подтвержден Google'ом
- ✅ **Связывание аккаунтов**: Если email уже существует, добавляем google_id

---

## 📁 Созданные файлы:

### Backend:
```
✅ backend/app/core/google_auth.py          - Google OAuth utilities
✅ backend/app/schemas/google_auth.py        - Pydantic схемы
✅ backend/app/api/auth.py                   - Обновлен с Google endpoints
```

### Frontend:
```
✅ components/GoogleSignInButton.tsx         - Компонент кнопки
✅ utils/authService.ts                      - Добавлен googleAuth()
✅ contexts/AuthContext.tsx                  - Добавлен googleLogin()
✅ app/login.tsx                             - Добавлена Google кнопка
✅ app.json                                  - Настроены Client IDs
✅ constants/api.ts                          - Добавлен GOOGLE endpoint
```

### Документация:
```
✅ GOOGLE_OAUTH_SETUP.md                     - Инструкции по настройке
✅ GOOGLE_OAUTH_COMPLETE.md                  - Этот файл
```

---

## ⚠️ Важные замечания:

### 1. Test Users в Google Cloud Console:

Пока ваше приложение в статусе "Testing", вы можете войти ТОЛЬКО с email'ами, добавленными в "Test users".

**Добавить test user:**
1. Google Cloud Console → OAuth consent screen
2. Test users → Add users
3. Введите свой email
4. Save

### 2. Production:

Когда будете готовы к production:
1. Измените OAuth consent screen status с "Testing" на "In production"
2. Обновите `GOOGLE_REDIRECT_URI` в `.env` на production URL
3. Добавьте production URL в "Authorized redirect URIs" в Google Cloud Console

### 3. Android:

Для Android нужно:
1. Создать Android OAuth client в Google Cloud Console
2. Получить SHA-1 fingerprint:
   ```bash
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
3. Добавить его в Google Cloud Console
4. Обновить `app.json` с Android Client ID

---

## 🐛 Troubleshooting:

### "Google Sign In ще не налаштовано"
→ Проверьте, что `googleIosClientId` и `googleWebClientId` в `app.json` заполнены

### "Google Play Services недоступні"
→ Это нормально для iOS симулятора. Игнорируйте это сообщение.

### "Invalid Google token"
→ Проверьте, что `GOOGLE_CLIENT_ID` в backend/.env совпадает с Web Client ID

### "Email already registered"
→ Если пользователь уже зарегистрирован через email/password, система автоматически добавит `google_id`

### Backend не видит GOOGLE_CLIENT_ID
→ Перезапустите backend: `docker-compose restart backend`

---

## ✅ Checklist перед тестированием:

- [ ] Скопировали `backend/env.example` в `backend/.env`
- [ ] Заполнили `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в `.env`
- [ ] Перезапустили backend (`docker-compose restart backend`)
- [ ] Проверили, что `app.json` содержит оба Client IDs
- [ ] Выполнили `npx expo prebuild --clean`
- [ ] Запустили `npx expo run:ios`
- [ ] Добавили свой email в Test users в Google Cloud Console

---

**Готово к тестированию! 🚀**

Дайте знать, когда заполните `.env` и запустите приложение!

