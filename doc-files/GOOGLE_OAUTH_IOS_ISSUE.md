# Google OAuth2 iOS Issue - ВІДКЛАДЕНО

**Дата**: 18.11.2024  
**Статус**: ⏸️ Відкладено до отримання Apple Developer Account

## 📋 Проблема

Google OAuth2 не працює на iOS через обмеження redirect URI.

### Технічні деталі:

1. **iOS Client ID отримує authorization code успішно** ✅
   - Client ID: `914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com`
   - Redirect URI: `com.googleusercontent.apps.914514821616-47musasu3ster3fjvjlbehc8fdrdgbno:/oauthredirect`
   - Authorization code отримується без проблем

2. **Backend не може обміняти код на токен** ❌
   - Backend використовує **Web Client ID** з client secret (як і потрібно для server-side flow)
   - Web Client ID: `914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com`
   - **Проблема**: Google Cloud Console не приймає custom URI schemes в "Authorized redirect URIs" для Web Client ID
   - Помилка: `invalid_grant: Bad Request`

3. **Root cause**:
   ```
   Google Web Client ID вимагає http:// або https:// redirect URIs
   Custom URI schemes (com.googleusercontent.apps.*://) НЕ підтримуються
   ```

## 🔧 Спроби виправлення

### Що було зроблено:

1. ✅ Налаштовано iOS Client ID в Google Cloud Console
2. ✅ Додано iOS Bundle ID: `com.alejka1337.buhassistant.dev`
3. ✅ Реалізовано Authorization Code Flow (замість Implicit Flow)
4. ✅ Backend правильно приймає код і redirect_uri від клієнта
5. ✅ Backend використовує Web Client ID для обміну кода (як потрібно)
6. ❌ **НЕ ВДАЛОСЯ**: Додати custom URI scheme в Web Client ID redirect URIs

### Що НЕ спрацювало:

- ❌ Native URI schemes (`com.alejka1337.buhassistant.dev:/oauthredirect`)
- ❌ Google reverse domain notation (`com.googleusercontent.apps.CLIENT_ID:/oauthredirect`)
- ❌ Використання iOS Client ID для обміну кода (не має client secret)

## 💡 Можливі рішення

### Варіант 1: Firebase Authentication ⭐ РЕКОМЕНДОВАНО
**Переваги:**
- Google офіційно підтримує Firebase для мобільних додатків
- Автоматично вирішує проблеми з redirect URIs
- Додаткові функції (Phone Auth, Social Auth, тощо)
- Безкоштовно для MVP

**Недоліки:**
- Потребує інтеграції Firebase SDK
- Додаткова залежність

**Кроки:**
1. Створити Firebase project
2. Додати iOS app в Firebase Console
3. Інтегрувати `firebase-auth` та `@react-native-firebase/auth`
4. Налаштувати Google Sign-In через Firebase Console
5. Використовувати Firebase Auth на backend для верифікації токенів

### Варіант 2: WebView OAuth Flow
**Переваги:**
- Не потребує Firebase
- Повний контроль над flow

**Недоліки:**
- Гірший UX (відкривається WebView замість native Google Sign-In)
- Потребує більше коду
- Можливі проблеми з cookies

**Кроки:**
1. Відкрити Google OAuth URL у WebView
2. Перехоплювати redirect на localhost
3. Запустити локальний HTTP server для отримання callback

### Варіант 3: Universal Links (потребує Apple Developer Account)
**Переваги:**
- Нативний UX
- Офіційний спосіб Apple

**Недоліки:**
- **Потребує платний Apple Developer Account ($99/рік)**
- Потребує власний домен з HTTPS
- Складніша настройка

**Кроки:**
1. Отримати Apple Developer Account
2. Налаштувати Associated Domains capability
3. Створити `.well-known/apple-app-site-association` файл на домені
4. Зареєструвати Universal Link як redirect URI в Google Console
5. Обробляти deep links в додатку

## 📝 Поточний стан

### Backend:
- ✅ Повністю готовий для Google OAuth2
- ✅ Підтримує Authorization Code Flow
- ✅ Правильно обробляє redirect_uri від клієнта
- ✅ Використовує Web Client ID для обміну кода
- ⚠️ Чекає на правильний redirect_uri від клієнта

### Frontend:
- ✅ Реалізовано Authorization Code Flow
- ✅ Успішно отримує authorization code від Google
- ✅ Передає код і redirect_uri на backend
- ⏸️ **Google Sign In ВІДКЛЮЧЕНО** (закоментовано в `app/login.tsx`)

### Файли:
- `components/GoogleSignInButton.tsx` - готовий компонент (працює до моменту обміну кода)
- `app/login.tsx` - Google Sign In закоментовано (рядки 213-218)
- `backend/app/api/auth.py` - повністю готовий Google OAuth endpoint
- `backend/app/core/google_auth.py` - повністю готовий Google Auth service

## 🚀 Наступні кроки

1. **Короткострокове рішення**: Використовувати тільки email/password авторизацію ✅ ЗРОБЛЕНО
2. **Довгострокове рішення**: 
   - Після отримання Apple Developer Account → розглянути Universal Links
   - АБО інтегрувати Firebase Authentication
   - АБО використовувати WebView flow

## 📚 Корисні посилання

- [Google OAuth2 для iOS](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Apple Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [expo-auth-session documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)

---

**Останнє оновлення**: 18.11.2024, 00:20

