# 🔧 Исправление Google OAuth Redirect URI

## 🐛 Проблема

**Ошибка:** `400: invalid_request` - Google не принимает custom scheme URI (`com.anonymous.buhassistant:/redirect`) в Web Application credentials.

**Причина:** Google требует только `http://` или `https://` для Web Application redirect URIs.

---

## ✅ Решение: Использование Expo Proxy

**Обновлено:** Теперь используется `useProxy: true` в `expo-auth-session`. Это официальный способ для OAuth в Expo приложениях.

### Redirect URI для Google Cloud Console:

**Для development:**
```
https://auth.expo.io/@anonymous/buhassistant
```

**Для localhost (опционально):**
```
exp://localhost:8081
```

**⚠️ Важно:** Теперь используется **Web Client ID** и **Expo proxy**, а не custom scheme.

---

### Шаг 2: Добавить Redirect URI в Google Cloud Console

#### Для iOS Client:

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в **APIs & Services** → **Credentials**
4. Найдите **OAuth 2.0 Client ID (iOS)**:
   ```
   914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com
   ```
5. Нажмите на него для редактирования
6. В разделе **Bundle ID** убедитесь, что указано:
   ```
   com.anonymous.buhassistant
   ```
7. **Save**

#### Для Web Client (Backend):

1. В том же разделе **Credentials** найдите **OAuth 2.0 Client ID (Web application)**:
   ```
   914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com
   ```
2. Нажмите на него для редактирования
3. В разделе **Authorized redirect URIs** добавьте:
   ```
   com.anonymous.buhassistant:/redirect
   ```
4. **Save**

---

### Шаг 3: Пересобрать приложение

После изменений в `GoogleSignInButton.tsx`:

```bash
cd /Users/alejka1337/Desktop/buhassistant
npx expo prebuild --clean
npx expo run:ios
```

---

## 🔍 Отладка

### Проверить какой Redirect URI генерируется:

После запуска приложения откройте Metro bundler terminal и найдите лог:

```
Google OAuth Config: {
  clientId: "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com",
  redirectUri: "com.anonymous.buhassistant:/redirect",
  iosClientId: "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com",
  webClientId: "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com"
}
```

**Проверьте:** `redirectUri` должен быть **`com.anonymous.buhassistant:/redirect`** (с двумя "s" и одним слешем)

---

## 📋 Checklist

- [ ] Redirect URI в коде: `com.anonymous.buhassistant:/redirect` ✅ (исправлено)
- [ ] Bundle ID в Google Cloud Console: `com.anonymous.buhassistant`
- [ ] Redirect URI добавлен в Web Client credentials
- [ ] Приложение пересобрано
- [ ] Test user добавлен в Google Cloud Console

---

## 🎯 Ожидаемый результат

После правильной настройки:

1. Нажимаете "Увійти через Google"
2. Открывается WebBrowser с Google Sign In
3. Выбираете аккаунт
4. **Успешный redirect** обратно в приложение
5. Получаете ID token
6. Успешный вход

---

## ⚠️ Частые ошибки

### Ошибка: `invalid_request`
**Причина:** Redirect URI не добавлен в Google Cloud Console  
**Решение:** Добавьте `com.anonymous.buhassistant:/redirect` в Web Client credentials

### Ошибка: `redirect_uri_mismatch`
**Причина:** URI в коде не совпадает с настройками  
**Решение:** Убедитесь, что используется `com.anonymous.buhassistant:/redirect` (один slash)

### Ошибка: `Access blocked`
**Причина:** Test user не добавлен  
**Решение:** Добавьте свой email в OAuth consent screen → Test users

---

## 📝 Важные замечания

### Формат Redirect URI для expo-auth-session:

**Правильно:**
```
com.anonymous.buhassistant:/redirect
```

**Неправильно:**
```
com.anonymous.buhassistant://redirect  ❌ (два слеша)
com.anonymous.buhassitant:/redirect    ❌ (опечатка: buhassitant)
```

### iOS vs Web Client IDs:

- **iOS Client ID** - используется в `app.json` (`googleIosClientId`)
- **Web Client ID** - используется для верификации токенов на backend

**В `expo-auth-session` для iOS:**
- `clientId` в `useAuthRequest` = **iOS Client ID**
- Но redirect URI все равно должен быть добавлен в **Web Client credentials**!

Это особенность Google OAuth - redirect URIs настраиваются в Web Client, даже для мобильных приложений.

---

## ✅ Итого

### Изменено в коде:
- ✅ Явный redirect URI: `'com.anonymous.buhassistant:/redirect'`
- ✅ Добавлено логирование для отладки

### Что нужно сделать:
1. ✅ Проверить Bundle ID в iOS Client (Google Cloud Console)
2. ⏳ **Добавить redirect URI в Web Client credentials** (самое важное!)
3. ⏳ Пересобрать приложение

---

**После настройки Google Cloud Console и пересборки, Google OAuth должен заработать!** 🚀

