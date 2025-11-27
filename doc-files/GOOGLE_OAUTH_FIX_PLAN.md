# 🔧 План исправления Google OAuth2

## 📋 Текущее состояние

### ✅ Что уже реализовано:

**Backend:**
- ✅ `backend/app/api/auth.py` - endpoint `POST /api/auth/google`
- ✅ `backend/app/core/google_auth.py` - утилиты для верификации Google токенов
- ✅ `backend/app/schemas/google_auth.py` - Pydantic схемы
- ✅ Логика создания пользователя и связывания по email

**Frontend:**
- ✅ `components/GoogleSignInButton.tsx` - компонент с expo-auth-session
- ✅ `utils/authService.ts` - функция `loginWithGoogle(idToken)`
- ✅ `contexts/AuthContext.tsx` - интеграция с контекстом
- ✅ `app.json` - Client IDs для iOS и Web
- ✅ Кнопка на `app/login.tsx`

### ⚠️ Известные проблемы из документации:

1. **Redirect URI mismatch** - возможные проблемы с Expo proxy URL
2. **IdToken flow** - сложности с получением id_token в hash fragment
3. **PKCE конфликт** - usePKCE должен быть `false` для IdToken flow
4. **Nonce** - не всегда добавляется автоматически

---

## 🔍 Что нужно проверить

### 1. Backend Configuration

**Файл:** `backend/.env`

Проверить наличие и корректность:
```bash
GOOGLE_CLIENT_ID=914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

**Действие:**
```bash
cd /Users/alejka1337/Desktop/buhassistant/backend
cat .env | grep GOOGLE
```

Если пустые или неправильные - добавить из файлов:
- Web credentials: `client_secret_914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com.json`
- iOS credentials: `client_914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com.plist`

---

### 2. Google Cloud Console - Redirect URIs

**Проверить в Google Cloud Console:**

1. Перейти: https://console.cloud.google.com/apis/credentials
2. Выбрать проект "BuhAssistant"
3. OAuth 2.0 Client IDs → "Web client" (для backend)
4. Authorized redirect URIs должны включать:
   - `https://auth.expo.io/@anonymous/buhassistant` (Expo proxy)
   - `http://localhost:8081` (для разработки)
   - `exp://192.168.0.102:8081` (для физического устройства)

5. OAuth 2.0 Client IDs → "iOS client"
6. Bundle ID должен быть: `com.alejka1337.buhassistant`

**Если URI отсутствуют - добавить их!**

---

### 3. Frontend - Expo Scheme

**Файл:** `app.json`

Проверить:
```json
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "bundleIdentifier": "com.alejka1337.buhassistant"
    }
  }
}
```

**Возможная проблема:** схема `myapp` может конфликтовать.

**Решение:** Изменить на уникальную:
```json
{
  "expo": {
    "scheme": "buhassistant",
    ...
  }
}
```

---

### 4. Redirect URI в GoogleSignInButton

**Файл:** `components/GoogleSignInButton.tsx` (строка 42)

Текущее значение:
```typescript
const redirectUri = 'https://auth.expo.io/@anonymous/buhassistant';
```

**Проблема:** Если у вас есть Expo аккаунт, нужно использовать:
```typescript
const redirectUri = 'https://auth.expo.io/@YOUR_EXPO_USERNAME/buhassistant';
```

**Решение 1 (если есть Expo аккаунт):**
```typescript
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
  // Expo автоматически подставит правильный username
});
```

**Решение 2 (для анонимных проектов):**
Оставить как есть, но убедиться, что URL точно совпадает с Google Console.

---

### 5. Backend Google Token Verification

**Файл:** `backend/app/core/google_auth.py`

Проверить функцию `verify_google_token(token: str)`:

**Возможные проблемы:**
1. Неправильный `GOOGLE_CLIENT_ID` для верификации
2. Timeout при запросе к Google API
3. Неправильная аудитория токена

**Что проверить:**
```python
# В google_auth.py должно быть примерно так:
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token: str) -> GoogleUserInfo:
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID  # ⚠️ Должен быть ПРАВИЛЬНЫЙ Client ID
        )
        
        # Проверка аудитории (должен быть iOS Client ID или Web Client ID)
        if idinfo['aud'] not in [settings.GOOGLE_CLIENT_ID, settings.GOOGLE_IOS_CLIENT_ID]:
            raise ValueError('Invalid audience')
        
        return GoogleUserInfo(
            google_id=idinfo['sub'],
            email=idinfo['email'],
            name=idinfo.get('name', ''),
            picture=idinfo.get('picture'),
        )
    except ValueError as e:
        raise ValueError(f"Invalid Google token: {e}")
```

**Проблема:** Если backend использует только Web Client ID, а frontend отправляет токен с iOS Client ID - верификация провалится.

**Решение:** В `google_auth.py` проверять оба Client ID:
```python
VALID_CLIENT_IDS = [
    settings.GOOGLE_CLIENT_ID,  # Web
    settings.GOOGLE_IOS_CLIENT_ID,  # iOS
]

if idinfo['aud'] not in VALID_CLIENT_IDS:
    raise ValueError('Invalid audience')
```

---

## 🛠️ План исправлений (по приоритету)

### Шаг 1: Проверить backend .env

```bash
cd /Users/alejka1337/Desktop/buhassistant/backend
cat .env | grep GOOGLE
```

Если пусто - добавить:
```bash
echo "GOOGLE_CLIENT_ID=914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com" >> .env
echo "GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_ACTUAL_SECRET" >> .env
echo "GOOGLE_IOS_CLIENT_ID=914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com" >> .env
```

Перезапустить backend:
```bash
docker-compose restart backend
```

---

### Шаг 2: Обновить google_auth.py для поддержки обоих Client ID

**Файл:** `backend/app/core/google_auth.py`

Добавить в `settings` (если нет):
```python
GOOGLE_IOS_CLIENT_ID: str = Field(..., env="GOOGLE_IOS_CLIENT_ID")
```

В функции `verify_google_token`:
```python
VALID_CLIENT_IDS = [
    settings.GOOGLE_CLIENT_ID,
    settings.GOOGLE_IOS_CLIENT_ID,
]

if idinfo['aud'] not in VALID_CLIENT_IDS:
    raise ValueError(f"Invalid audience: {idinfo['aud']}")
```

---

### Шаг 3: Проверить Google Cloud Console Redirect URIs

Перейти: https://console.cloud.google.com/apis/credentials

**Для Web Client ID:**
- ✅ `https://auth.expo.io/@anonymous/buhassistant`
- ✅ `http://localhost:8081`
- ✅ `exp://localhost:8081`

**Для iOS Client ID:**
- ✅ Bundle ID: `com.alejka1337.buhassistant`

Если чего-то нет - добавить!

---

### Шаг 4: Улучшить GoogleSignInButton.tsx

**Использовать динамический redirect URI:**

```typescript
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
  // Expo сам определит правильный URL
});

console.log('Generated redirect URI:', redirectUri);
```

Это автоматически сгенерирует правильный URL для вашего Expo аккаунта.

---

### Шаг 5: Тестирование

1. **Перезапустить backend:**
   ```bash
   docker-compose restart backend
   ```

2. **Перезапустить Metro:**
   ```bash
   # В терминале где запущен expo
   # Нажать 'r' для reload
   ```

3. **На iPhone:**
   - Открыть приложение
   - Перейти на экран логина
   - Нажать "Увійти через Google"
   - Проверить консоль и логи backend

4. **Проверить логи backend:**
   ```bash
   docker logs buhassistant_backend --tail 50 -f
   ```

5. **Проверить консоль React Native:**
   - Смотреть на вывод в терминале где запущен Metro
   - Искать ошибки Google OAuth

---

## 🐛 Возможные ошибки и решения

### Ошибка: "redirect_uri_mismatch"

**Причина:** URL в запросе не совпадает с зарегистрированным в Google Console.

**Решение:**
1. Скопировать точный redirect URI из лога (console.log в GoogleSignInButton)
2. Добавить его в Google Console
3. Подождать 5 минут (Google кеширует настройки)

---

### Ошибка: "Invalid audience"

**Причина:** Backend пытается верифицировать токен с неправильным Client ID.

**Решение:**
Добавить поддержку обоих Client ID (см. Шаг 2).

---

### Ошибка: "No id_token in response"

**Причина:** Google возвращает токен в hash fragment (#), а не в query params.

**Решение:** В `GoogleSignInButton.tsx` уже есть обработчик для hash fragments (строки 131-179). Убедиться, что он работает.

---

### Ошибка: "PKCE code_challenge is required"

**Причина:** Google требует PKCE для authorization code flow, но мы используем implicit flow (IdToken).

**Решение:** Убедиться, что `usePKCE: false` в `useAuthRequest`.

---

## 📝 Checklist для финальной проверки

- [ ] Backend `.env` содержит оба Google Client ID
- [ ] `google_auth.py` верифицирует оба Client ID
- [ ] Google Console содержит все нужные Redirect URIs
- [ ] `app.json` имеет правильный `bundleIdentifier`
- [ ] `GoogleSignInButton.tsx` использует `makeRedirectUri` или правильный статичный URL
- [ ] Backend перезапущен после изменений
- [ ] Приложение перезапущено на iPhone
- [ ] Логи backend показывают успешную верификацию токена
- [ ] Пользователь успешно создается/логинится

---

## 🎯 Следующие шаги после исправления

1. **Протестировать полный flow:**
   - Регистрация через Google (новый пользователь)
   - Логин через Google (существующий пользователь)
   - Связывание email (пользователь зарегистрирован через email, логинится через Google)

2. **Добавить обработку ошибок:**
   - User-friendly сообщения
   - Retry mechanism
   - Offline fallback

3. **Обновить документацию:**
   - Создать `GOOGLE_OAUTH_SETUP.md` с финальными инструкциями
   - Добавить скриншоты Google Console
   - Примеры успешных логов

---

## 📚 Полезные ссылки

- [Expo AuthSession docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth2 for Mobile Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google ID Token verification](https://developers.google.com/identity/sign-in/web/backend-auth)
- [Expo redirect URI troubleshooting](https://docs.expo.dev/guides/authentication/#redirects)

