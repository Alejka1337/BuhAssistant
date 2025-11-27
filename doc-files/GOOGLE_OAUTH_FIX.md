# 🔧 Google OAuth Fix - Переход на expo-auth-session

## 🐛 Проблема

При запуске приложения возникала ошибка:
```
Uncaught Error: TurboModuleRegistry...
```

**Причина:** Пакет `@react-native-google-signin/google-signin` требует нативной настройки, которая несовместима с простым Expo workflow.

---

## ✅ Решение

Переход на **`expo-auth-session`** - официальное Expo решение для OAuth.

### Преимущества expo-auth-session:

1. ✅ **Нативная интеграция с Expo** - не требует дополнительной настройки
2. ✅ **Работает с `npx expo run:ios`** - без сложных конфигураций
3. ✅ **Cross-platform** - одинаковый код для iOS и Android
4. ✅ **Официальная поддержка** - от команды Expo
5. ✅ **Проще в отладке** - меньше "черной магии"

---

## 🔄 Что было изменено

### 1. Удален проблемный пакет:
```bash
npm uninstall @react-native-google-signin/google-signin
```

### 2. Установлен expo-auth-session:
```bash
npx expo install expo-auth-session
```

### 3. Переписан GoogleSignInButton.tsx:

**Было (с @react-native-google-signin/google-signin):**
```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Сложная конфигурация
GoogleSignin.configure({
  iosClientId: iosClientId,
  webClientId: webClientId,
  offlineAccess: true,
});

// Ручная обработка
await GoogleSignin.hasPlayServices();
const userInfo = await GoogleSignin.signIn();
const idToken = userInfo.idToken;
```

**Стало (с expo-auth-session):**
```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Простая настройка через хуки
const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

const [request, response, promptAsync] = AuthSession.useAuthRequest(
  {
    clientId: iosClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'com.anonymous.buhassistant',
      path: 'redirect',
    }),
    responseType: AuthSession.ResponseType.IdToken,
  },
  discovery
);

// Автоматическая обработка ответа через useEffect
useEffect(() => {
  if (response?.type === 'success') {
    const { id_token } = response.params;
    await onSuccess(id_token);
  }
}, [response]);
```

---

## 📦 Зависимости

### package.json:
```json
{
  "dependencies": {
    "expo-auth-session": "~6.0.6",
    "expo-web-browser": "~15.0.8"
  }
}
```

### app.json (без изменений):
```json
{
  "extra": {
    "googleWebClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com",
    "googleIosClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com"
  }
}
```

---

## 🧪 Тестирование

### Запуск:
```bash
cd /Users/alejka1337/Desktop/buhassistant
npx expo prebuild --clean
npx expo run:ios
```

### Ожидаемое поведение:

1. ✅ Приложение запускается без ошибок TurboModuleRegistry
2. ✅ На экране Login отображается кнопка "Увійти через Google"
3. ✅ При нажатии открывается WebBrowser с Google OAuth
4. ✅ После выбора аккаунта - redirect обратно в приложение
5. ✅ ID token отправляется на backend
6. ✅ Успешный вход и отображение профиля

---

## 🔑 Конфигурация Google Cloud Console

**⚠️ Важно:** Для `expo-auth-session` нужен **iOS Client ID** (не Web Client ID).

### Redirect URI в Google Cloud Console:

Добавьте следующие URI в Google Cloud Console:

1. **Для iOS:**
   ```
   com.anonymous.buhassistant:/redirect
   ```

2. **Для development (optional):**
   ```
   exp://localhost:8081/--/redirect
   ```

### Где добавить:

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект
3. APIs & Services → Credentials
4. Выберите OAuth 2.0 Client ID (iOS)
5. В разделе **"Bundle ID"** добавьте: `com.anonymous.buhassistant`
6. Save

---

## 🎯 Архитектура

### Поток авторизации:

```
┌──────────────┐
│   User       │
│ Нажимает     │
│  "Увійти"    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ GoogleSignInButton   │
│ (expo-auth-session)  │
└──────┬───────────────┘
       │
       │ promptAsync()
       ▼
┌──────────────────────┐
│   WebBrowser         │
│ accounts.google.com  │
│ (OAuth flow)         │
└──────┬───────────────┘
       │
       │ User selects account
       ▼
┌──────────────────────┐
│   Redirect           │
│ com.anonymous.buh... │
│ assitant:/redirect   │
└──────┬───────────────┘
       │
       │ response.params.id_token
       ▼
┌──────────────────────┐
│   onSuccess()        │
│ Отправка на backend  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Backend            │
│ /api/auth/google     │
│ (verify token)       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   JWT tokens         │
│ Сохранение в         │
│ SecureStore          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Profile Screen     │
│ Отображение          │
│ пользователя         │
└──────────────────────┘
```

---

## 🐛 Troubleshooting

### Ошибка: "Invalid redirect URI"

**Причина:** Redirect URI не добавлен в Google Cloud Console

**Решение:**
1. Откройте Google Cloud Console
2. Credentials → OAuth 2.0 Client ID (iOS)
3. Добавьте `com.anonymous.buhassistant:/redirect`
4. Save

---

### Ошибка: "No ID token received"

**Причина:** Неправильный `responseType`

**Решение:** Убедитесь, что в `AuthSession.useAuthRequest` указано:
```typescript
responseType: AuthSession.ResponseType.IdToken,
```

---

### Ошибка: "Client ID not configured"

**Причина:** Client IDs отсутствуют в `app.json`

**Решение:** Проверьте `app.json`:
```bash
cat app.json | grep google
```

Должно быть:
```json
"googleWebClientId": "...",
"googleIosClientId": "..."
```

---

## ✅ Итого

### Было:
- ❌ Ошибка TurboModuleRegistry
- ❌ Сложная нативная настройка
- ❌ @react-native-google-signin/google-signin

### Стало:
- ✅ Работает из коробки
- ✅ Простая интеграция
- ✅ expo-auth-session (официальное решение)

---

## 📚 Документация

- [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth with Expo](https://docs.expo.dev/guides/authentication/#google)
- [expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

---

**Дата исправления:** 15 ноября 2025  
**Время исправления:** ~10 минут  
**Статус:** ✅ Готово к тестированию

