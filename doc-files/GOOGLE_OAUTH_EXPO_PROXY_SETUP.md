# 🔧 Google OAuth с Expo Proxy - Настройка

## ✅ Что изменилось

**Проблема:** Google не принимает custom scheme URI (`com.anonymous.buhassistant:/redirect`) в Web Application credentials.

**Решение:** Использование **Expo Proxy** (`useProxy: true`) - это официальный способ для OAuth в Expo приложениях.

---

## 🎯 Преимущества Expo Proxy

1. ✅ **Не нужно настраивать custom schemes** - Expo обрабатывает redirect автоматически
2. ✅ **Работает с `https://` redirect URIs** - Google их принимает
3. ✅ **Проще настройка** - один redirect URI для всех платформ
4. ✅ **Официальная поддержка** - от команды Expo

---

## 📋 Настройка Google Cloud Console

### Шаг 1: Откройте Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. **APIs & Services** → **Credentials**

### Шаг 2: Настройте Web Client ID

1. Найдите **OAuth 2.0 Client ID (Web application)**:
   ```
   914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com
   ```
2. Нажмите на него для редактирования
3. В разделе **Authorized redirect URIs** добавьте:

   **Для development (локальная разработка):**
   ```
   https://auth.expo.io/@anonymous/buhassistant
   ```

   **Или для localhost (если используете Expo Go):**
   ```
   exp://localhost:8081
   ```

   **Для production (когда опубликуете в EAS):**
   ```
   https://auth.expo.io/@your-expo-username/buhassistant
   ```

4. **Save**

### Шаг 3: Проверьте iOS Client (опционально)

1. Найдите **OAuth 2.0 Client ID (iOS)**:
   ```
   914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com
   ```
2. Убедитесь, что **Bundle ID** = `com.anonymous.buhassistant`
3. **Save**

---

## 🔍 Как узнать правильный Redirect URI

### Вариант 1: Проверить в логах

После запуска приложения, в Metro bundler terminal будет лог:

```
Google OAuth Config: {
  clientId: "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com",
  useProxy: true,
  ...
}
```

Когда вы нажмете "Увійти через Google", Expo автоматически сгенерирует redirect URI и покажет его в логах или в URL браузера.

### Вариант 2: Использовать универсальный URI

Добавьте оба варианта в Google Cloud Console:

```
https://auth.expo.io/@anonymous/buhassistant
exp://localhost:8081
```

---

## 🧪 Тестирование

### После настройки:

1. Пересоберите приложение:
   ```bash
   npx expo prebuild --clean
   npx expo run:ios
   ```

2. Откройте приложение
3. Перейдите в **Профіль** → **Увійти**
4. Нажмите **"Увійти через Google"**

### Ожидаемое поведение:

1. ✅ Откроется WebBrowser с Google Sign In
2. ✅ Выберите аккаунт
3. ✅ **Expo proxy обработает redirect** (автоматически)
4. ✅ Вернетесь в приложение с ID token
5. ✅ Успешный вход

---

## ⚠️ Troubleshooting

### Ошибка: `redirect_uri_mismatch`

**Причина:** Redirect URI не добавлен в Google Cloud Console

**Решение:**
1. Проверьте логи Metro bundler - какой redirect URI использует Expo
2. Добавьте этот URI в Google Cloud Console
3. Обычно это: `https://auth.expo.io/@anonymous/buhassistant`

### Ошибка: `invalid_client`

**Причина:** Используется неправильный Client ID

**Решение:**
- Для `useProxy: true` нужен **Web Client ID** (не iOS)
- Проверьте `app.json` - `googleWebClientId` должен быть заполнен

### Ошибка: `Access blocked`

**Причина:** Test user не добавлен

**Решение:**
1. **OAuth consent screen** → **Test users**
2. **+ Add Users**
3. Добавьте свой Google email
4. **Save**

---

## 📝 Важные замечания

### Client IDs в app.json:

```json
{
  "extra": {
    "googleWebClientId": "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com",
    "googleIosClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com"
  }
}
```

**Для `useProxy: true`:**
- Используется **Web Client ID** (`googleWebClientId`)
- iOS Client ID не используется, но можно оставить для будущего

### Expo Proxy URL формат:

**Development:**
```
https://auth.expo.io/@anonymous/buhassistant
```

**Production (после публикации в EAS):**
```
https://auth.expo.io/@your-expo-username/buhassistant
```

Где `@your-expo-username` - ваш Expo username (можно найти в `app.json` → `owner` или в `eas.json`).

---

## ✅ Checklist

- [x] Код обновлен: `useProxy: true` ✅
- [x] Используется Web Client ID ✅
- [ ] Добавить redirect URI в Google Cloud Console:
  - [ ] `https://auth.expo.io/@anonymous/buhassistant`
  - [ ] `exp://localhost:8081` (опционально)
- [ ] Пересобрать приложение
- [ ] Протестировать Google Sign In

---

## 🎯 Итого

### Изменения в коде:
- ✅ Добавлен `useProxy: true` в `useAuthRequest`
- ✅ Используется Web Client ID (вместо iOS)
- ✅ Убран явный `redirectUri` (Expo генерирует автоматически)

### Что нужно сделать:
1. ⏳ **Добавить redirect URI в Google Cloud Console:**
   ```
   https://auth.expo.io/@anonymous/buhassistant
   ```
2. ⏳ Пересобрать приложение
3. ⏳ Протестировать

---

**После добавления redirect URI в Google Cloud Console, Google OAuth должен заработать!** 🚀

