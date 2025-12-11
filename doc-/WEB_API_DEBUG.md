# 🔍 Web API URL Debug Guide

## Проблема
Веб версія тягне дані з продакшн сервера замість локального ngrok.

---

## ✅ Що перевірити

### 1. Файли конфігурації

**app.json (line 87):**
```json
"apiUrl": "https://90a8375ea3d8.ngrok-free.app"
```

**constants/api.ts (line 21):**
```typescript
export const API_URL = API_URL_FROM_CONFIG || 'https://90a8375ea3d8.ngrok-free.app';
```

### 2. Консоль браузера

Відкрийте `http://localhost:8081` і перевірте консоль браузера (F12).

**Має бути:**
```
📋 Constants.expoConfig?.extra?.apiUrl: https://90a8375ea3d8.ngrok-free.app
📋 API_URL_FROM_CONFIG: https://90a8375ea3d8.ngrok-free.app
🔗 API_URL (final): https://90a8375ea3d8.ngrok-free.app
```

**Якщо показує інше:**
```
🔗 API_URL (final): https://api.eglavbuh.com.ua  ❌ НЕПРАВИЛЬНО!
```

---

## 🔧 Рішення

### Спосіб 1: Очистити кеш (РЕКОМЕНДОВАНО)

```bash
# Зупинити поточний процес
Ctrl+C

# Очистити кеш і перезапустити
npx expo start --clear --web
```

### Спосіб 2: Очистити кеш браузера

**Chrome/Edge/Brave:**
1. F12 → Console
2. ПКМ на кнопці Reload → Empty Cache and Hard Reload
3. Або: Ctrl+Shift+Del → Clear cache

**Safari:**
1. Develop → Empty Caches
2. Cmd+Option+E

**Firefox:**
1. Ctrl+Shift+Del
2. Select "Cache" → Clear

### Спосіб 3: Перевірити що Metro bundler запущений з правильним кешем

```bash
# Повністю видалити кеш
rm -rf node_modules/.cache
rm -rf .expo

# Перезапустити
npx expo start --clear --web
```

### Спосіб 4: Хардкод (тимчасово для дебагу)

В `constants/api.ts`:
```typescript
// Тимчасово хардкодимо для тестування
export const API_URL = 'https://90a8375ea3d8.ngrok-free.app';
console.log('🔗 API_URL (hardcoded):', API_URL);
```

---

## 🧪 Як тестувати

### 1. Відкрити веб версію
```
http://localhost:8081
```

### 2. Відкрити консоль браузера (F12)

### 3. Перевірити логи
Має бути:
```
📋 Constants.expoConfig?.extra?.apiUrl: https://90a8375ea3d8.ngrok-free.app
📋 API_URL_FROM_CONFIG: https://90a8375ea3d8.ngrok-free.app
🔗 API_URL (final): https://90a8375ea3d8.ngrok-free.app
```

### 4. Перевірити Network tab
- F12 → Network
- Filter: XHR/Fetch
- Перезавантажити сторінку
- Перевірити що запити йдуть на `https://90a8375ea3d8.ngrok-free.app`

---

## 🐛 Можливі причини проблеми

### 1. Кеш Metro Bundler
Metro bundler кешує `app.json` і може не підхопити зміни.

**Рішення:** `npx expo start --clear`

### 2. Кеш браузера
Браузер кешує JavaScript бандл з старим API URL.

**Рішення:** Hard Reload (Ctrl+Shift+R)

### 3. Service Worker
Якщо є Service Worker, він може кешувати старі файли.

**Рішення:** 
- F12 → Application → Service Workers → Unregister
- Clear Site Data

### 4. Constants.expoConfig не працює на веб
Іноді `Constants.expoConfig` може не працювати коректно на веб.

**Рішення:** Хардкод API_URL тимчасово

---

## ✅ Після виправлення

1. **Перезапустити з очищенням кешу:**
   ```bash
   npx expo start --clear --web
   ```

2. **Очистити кеш браузера:**
   - Hard Reload (Ctrl+Shift+R)

3. **Перевірити консоль:**
   - Має бути `https://90a8375ea3d8.ngrok-free.app`

4. **Перевірити Network tab:**
   - Запити мають йти на локальний ngrok

---

## 📝 Після тестування

Коли закінчите тестувати локально, поверніть production URL:

**app.json:**
```json
"apiUrl": "https://api.eglavbuh.com.ua"
```

**constants/api.ts:**
```typescript
export const API_URL = API_URL_FROM_CONFIG || 'https://api.eglavbuh.com.ua';
```

І знову:
```bash
npx expo start --clear --web
```

---

**Готово!** 🎉

