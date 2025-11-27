# 🔐 Google OAuth2 Setup Instructions

## 📝 Что у вас есть:

1. **iOS plist файл**: `client_914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com.plist`
2. **Web JSON файл**: `client_secret_914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com.json`

---

## ⚙️ Шаг 1: Извлечение credentials для Backend

### Откройте файл `client_secret_***.json`

Он должен выглядеть примерно так:

```json
{
  "web": {
    "client_id": "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com",
    "project_id": "buhassistant-xxxxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-xxxxxxxxxxxxxxxxxxxxx",
    "redirect_uris": ["http://localhost:8000/api/auth/google/callback"]
  }
}
```

### Скопируйте:
- **client_id**: `914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com`
- **client_secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

---

## 📱 Шаг 2: Извлечение credentials для iOS

### Откройте файл `client_***.plist`

Он должен выглядеть примерно так:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CLIENT_ID</key>
    <string>914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com</string>
    <key>REVERSED_CLIENT_ID</key>
    <string>com.googleusercontent.apps.914514821616-47musasu3ster3fjvjlbehc8fdrdgbno</string>
    ...
</dict>
</plist>
```

### Скопируйте:
- **CLIENT_ID**: `914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com`

---

## 🔧 Шаг 3: Создание backend/.env файла

Скопируйте `backend/env.example` в `backend/.env`:

```bash
cd /Users/alejka1337/Desktop/buhassistant/backend
cp env.example .env
```

Откройте `backend/.env` и замените:

```bash
# Google OAuth2
GOOGLE_CLIENT_ID=914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

**⚠️ Замените** `GOCSPX-xxxxxxxxxxxxxxxxxxxxx` на реальный client_secret из вашего JSON файла!

---

## 📱 Шаг 4: Обновление app.json с iOS Client ID

Добавьте в `app.json`:

```json
{
  "expo": {
    ...
    "ios": {
      ...
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "extra": {
      "googleWebClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com",
      "googleIosClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com"
    }
  }
}
```

---

## ✅ Шаг 5: Проверка

После настройки у вас должны быть:

### Backend (.env):
```
GOOGLE_CLIENT_ID=914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx (ваш реальный)
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### Frontend (app.json > extra):
```json
{
  "googleWebClientId": "914514821616-rh81j21a2qbqu104j45j6j09661jo6qm.apps.googleusercontent.com",
  "googleIosClientId": "914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com"
}
```

---

## 🎯 Следующие шаги

После того, как вы настроите credentials:

1. ✅ Перезапустите backend контейнер:
   ```bash
   cd backend
   docker-compose restart backend
   ```

2. ✅ Я создам Google OAuth endpoints на backend
3. ✅ Я добавлю кнопку "Увійти через Google" на frontend
4. ✅ Мы протестируем авторизацию

---

## 🔍 Как найти значения в файлах

### В JSON (Web credentials):
```bash
cat client_secret_***.json | grep client_id
cat client_secret_***.json | grep client_secret
```

### В PLIST (iOS credentials):
```bash
cat client_***.plist | grep CLIENT_ID
```

Или просто откройте файлы в текстовом редакторе!

---

**Готовы продолжить?** Дайте знать, когда заполните `.env` файл! 🚀

