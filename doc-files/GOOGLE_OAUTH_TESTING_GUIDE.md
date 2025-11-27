# 🧪 Тестирование Google OAuth2 - Пошаговая инструкция

## ✅ Что уже сделано

### Backend:
- ✅ Добавлен `GOOGLE_IOS_CLIENT_ID` в `config.py`
- ✅ Обновлен `google_auth.py` для поддержки обоих Client ID (Web + iOS)
- ✅ Добавлен `GOOGLE_IOS_CLIENT_ID` в `.env`
- ✅ Backend перезапущен

### Frontend:
- ✅ `app.json` содержит оба Client ID
- ✅ Bundle ID: `com.alejka1337.buhassistant.dev` (синхронизирован с Xcode)
- ✅ `GoogleSignInButton.tsx` реализован с expo-auth-session

### Google Cloud Console:
- ✅ Web Client ID: `914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com`
- ✅ iOS Client ID: `914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com`
- ✅ Redirect URIs:
  - `http://localhost:8000/api/auth/google/callback`
  - `https://auth.expo.io/@anonymous/buhassistant`
  - `https://auth.expo.io/@alejka1337/buhassistant`
  - `http://localhost:8081`

---

## ⚠️ ЧТО НУЖНО ПРОВЕРИТЬ В GOOGLE CLOUD CONSOLE

### Шаг 1: Проверить iOS Client ID Bundle ID

1. **Перейти:** https://console.cloud.google.com/apis/credentials
2. **Выбрать проект:** BuhAssistant (или как вы его назвали)
3. **Найти iOS Client ID:** `914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com`
4. **Нажать на него для редактирования**
5. **Проверить Bundle ID:**
   - **Должно быть:** `com.alejka1337.buhassistant.dev`
   - **Если другое:** изменить на `com.alejka1337.buhassistant.dev`

**⚠️ ВАЖНО:** Bundle ID в Google Console ДОЛЖЕН ТОЧНО совпадать с Bundle ID в Xcode!

---

### Шаг 2: Проверить Web Client ID Redirect URIs

1. **Найти Web Client ID:** `914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com`
2. **Нажать на него для редактирования**
3. **Authorized redirect URIs** должны включать:
   ```
   http://localhost:8000/api/auth/google/callback
   https://auth.expo.io/@anonymous/buhassistant
   https://auth.expo.io/@alejka1337/buhassistant
   http://localhost:8081
   ```

**Если каких-то URI нет - добавить!**

4. **Нажать "SAVE"**
5. **Подождать 5 минут** (Google кеширует настройки)

---

## 🧪 Тестирование на iPhone

### Шаг 1: Перезапустить приложение

```bash
# В терминале где запущен Metro bundler
# Нажать 'r' для reload
```

**Или на iPhone:**
1. Полностью закрыть приложение (свайп вверх)
2. Открыть снова

---

### Шаг 2: Попробовать Google Sign In

1. **Открыть экран Login**
2. **Нажать "Увійти через Google"**
3. **Выбрать Google аккаунт**
4. **Разрешить доступ**

---

### Шаг 3: Проверить логи

#### Frontend (Metro bundler terminal):
Искать:
```
✅ Nonce is present in request URL
Auth Request URL: https://accounts.google.com/o/oauth2/v2/auth?...
Successfully received ID token from Google
```

**Или ошибки:**
```
⚠️ WARNING: Nonce is NOT present in request URL!
No id_token in response params
Google Auth Error: ...
```

#### Backend (Docker logs):
```bash
docker logs buhassistant_backend --tail 50 -f
```

**Искать:**
```
Successfully verified token with client_id: 914514821616-47mus...
POST /api/auth/google - 200 OK
```

**Или ошибки:**
```
Verification failed with client_id ...: Wrong audience
Token audience ... not in valid list
Invalid Google token: ...
POST /api/auth/google - 401 Unauthorized
```

---

## 🐛 Возможные проблемы и решения

### Проблема 1: "Invalid audience"

**Логи backend:**
```
Token audience 914514821616-XXXXXXX.apps.googleusercontent.com not in valid list
```

**Причина:** Bundle ID в Google Console не совпадает с реальным.

**Решение:**
1. Проверить Bundle ID в Xcode (должен быть `com.alejka1337.buhassistant.dev`)
2. Проверить Bundle ID в Google Console iOS Client ID
3. Синхронизировать их
4. Подождать 5 минут
5. Попробовать снова

---

### Проблема 2: "No id_token in response params"

**Логи frontend:**
```
No id_token in response params: {...}
```

**Причина:** Expo auth-session не получает токен в ожидаемом формате.

**Решение 1:** Проверить redirect URI

В `GoogleSignInButton.tsx` (строка ~42):
```typescript
const redirectUri = 'https://auth.expo.io/@alejka1337/buhassistant';
```

**Убедиться, что:**
- Username правильный (`alejka1337`)
- URI добавлен в Google Console

**Решение 2:** Использовать динамический redirect URI

Изменить в `GoogleSignInButton.tsx`:
```typescript
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
  // Expo автоматически определит правильный URL
});

console.log('Generated redirect URI:', redirectUri);
```

Скопировать URI из консоли и добавить в Google Console.

---

### Проблема 3: "redirect_uri_mismatch"

**Ошибка от Google:**
```
Error 400: redirect_uri_mismatch
```

**Причина:** Redirect URI в запросе не совпадает с зарегистрированным в Google Console.

**Решение:**
1. **Посмотреть в логах frontend точный redirect URI:**
   ```
   Generated redirect URI: https://auth.expo.io/@alejka1337/buhassistant
   ```

2. **Скопировать ТОЧНЫЙ URI**

3. **Добавить в Google Console → Web Client ID → Authorized redirect URIs**

4. **Сохранить и подождать 5 минут**

---

### Проблема 4: Token приходит в hash fragment (#)

**Логи frontend:**
```
Deep link received: https://auth.expo.io/@alejka1337/buhassistant#id_token=eyJhb...
```

**Это нормально для IdToken flow!**

`GoogleSignInButton.tsx` уже обрабатывает hash fragments (строки 131-179).

**Если не работает:**
Проверить, что в `useAuthRequest` установлено:
```typescript
responseType: AuthSession.ResponseType.IdToken, // ✅
usePKCE: false, // ✅ CRITICAL
```

---

### Проблема 5: Backend не видит iOS Client ID

**Логи backend:**
```
Verification failed with client_id : Wrong audience
```

**Решение:**
Проверить backend `.env`:
```bash
docker-compose exec backend cat .env | grep GOOGLE_IOS
```

**Должно быть:**
```
GOOGLE_IOS_CLIENT_ID=914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com
```

**Если нет:**
```bash
echo "GOOGLE_IOS_CLIENT_ID=914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com" >> backend/.env
docker-compose restart backend
```

---

## 📊 Проверка успешной интеграции

### ✅ Checklist:

- [ ] Backend `.env` содержит `GOOGLE_IOS_CLIENT_ID`
- [ ] Backend перезапущен без ошибок
- [ ] iOS Bundle ID в Google Console: `com.alejka1337.buhassistant.dev`
- [ ] Web Client ID содержит все нужные Redirect URIs
- [ ] Frontend `app.json` содержит оба Client ID
- [ ] Приложение перезапущено на iPhone
- [ ] При нажатии "Увійти через Google" открывается окно Google
- [ ] После выбора аккаунта возвращается в приложение
- [ ] Backend логи показывают `Successfully verified token`
- [ ] Пользователь успешно залогинен

---

## 🎯 Ожидаемый успешный flow

### Frontend (консоль Metro):
```
🔗 API_URL: http://192.168.0.102:8000
Google OAuth Config: {...}
Auth Request URL: https://accounts.google.com/o/oauth2/v2/auth?...
✅ Nonce is present in request URL
Deep link received: https://auth.expo.io/@alejka1337/buhassistant#id_token=eyJhb...
Extracted id_token from deep link hash fragment
Successfully received ID token from Google (via expo-auth-session)
```

### Backend (Docker logs):
```
INFO: POST /api/auth/google
Successfully verified token with client_id: 914514821616-47mus...
Created new user via Google OAuth: user@gmail.com
INFO: POST /api/auth/google - 200 OK
```

### iPhone screen:
```
✅ Успешно залогинен
→ Редирект на главный экран (tabs)
→ Профиль показывает имя пользователя
```

---

## 🔄 Если ничего не помогло

### Вариант 1: Пересоздать iOS Client ID в Google Console

1. **Удалить старый iOS Client ID**
2. **Создать новый:**
   - Type: iOS
   - Name: BuhAssistant iOS
   - Bundle ID: `com.alejka1337.buhassistant.dev`
3. **Скопировать новый Client ID**
4. **Обновить в `app.json`:**
   ```json
   "googleIosClientId": "НОВЫЙ_IOS_CLIENT_ID"
   ```
5. **Обновить в `backend/.env`:**
   ```bash
   GOOGLE_IOS_CLIENT_ID=НОВЫЙ_IOS_CLIENT_ID
   ```
6. **Перезапустить backend и приложение**

---

### Вариант 2: Использовать только Web Client ID

**Изменить `GoogleSignInButton.tsx`:**
```typescript
// Используем ТОЛЬКО Web Client ID
const clientId = webClientId; // Вместо: webClientId || iosClientId
```

**Убедиться, что Redirect URIs включают Expo proxy URLs.**

---

### Вариант 3: Временно отключить Google OAuth

**В `app/login.tsx`:**
Закомментировать кнопку Google Sign In:
```tsx
{/* <GoogleSignInButton
  onSuccess={handleGoogleSignIn}
  disabled={isLoading}
/> */}
```

**Сфокусироваться на Email/Password авторизации** (которая уже работает).

---

## 📚 Полезные ссылки

- **Google OAuth2 docs:** https://developers.google.com/identity/protocols/oauth2/native-app
- **Expo AuthSession:** https://docs.expo.dev/versions/latest/sdk/auth-session/
- **Google Console:** https://console.cloud.google.com/apis/credentials
- **Expo redirect URI troubleshooting:** https://docs.expo.dev/guides/authentication/#redirects

---

## 💡 Рекомендации

### Для MVP:
- Если Google OAuth сложно настроить - **временно отключите**
- Email/Password авторизация уже работает отлично
- После получения Apple Developer Account сфокусируйтесь на Push Notifications
- Google OAuth можно доделать позже

### Для Production:
- Используйте EAS Build для стабильной сборки
- Настройте proper redirect URIs для production домена
- Добавьте error tracking (Sentry)
- Логируйте все шаги OAuth flow для debugging

---

**Дата:** 2025-11-17  
**Статус:** Backend готов, нужно протестировать на iPhone  
**Следующий шаг:** Проверить Bundle ID в Google Console и протестировать  

