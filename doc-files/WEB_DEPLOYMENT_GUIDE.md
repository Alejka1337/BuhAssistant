# 🚀 Руководство по деплою веб-версии eGlavBuh на EC2

## Предварительные требования

- ✅ EC2 инстанс запущен и доступен
- ✅ Nginx установлен на сервере
- ✅ Домен `eglavbuh.com.ua` настроен и указывает на EC2
- ✅ SSH доступ к серверу настроен

---

## Вариант 1: Автоматический деплой (рекомендуется)

### Шаг 1: Подготовка скрипта

```bash
# Сделать скрипт исполняемым
chmod +x deploy-web.sh
```

### Шаг 2: Настройка Nginx на сервере

```bash
# Подключиться к серверу
ssh ubuntu@api.eglavbuh.com.ua

# Загрузить конфигурацию Nginx
sudo nano /etc/nginx/sites-available/eglavbuh-web
```

Вставить содержимое из файла `nginx-web.conf`, затем:

```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/eglavbuh-web /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Если все ОК, перезагрузить Nginx
sudo systemctl reload nginx
```

### Шаг 3: Настройка SSL (если еще не настроен)

```bash
# Установить Certbot (если еще не установлен)
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Получить SSL сертификат
sudo certbot --nginx -d eglavbuh.com.ua -d www.eglavbuh.com.ua

# Certbot автоматически обновит конфигурацию Nginx
```

### Шаг 4: Запуск деплоя

```bash
# На вашем локальном компьютере
cd /Users/alejka1337/Desktop/buhassistant
./deploy-web.sh
```

Скрипт автоматически:
1. ✅ Создаст production build
2. ✅ Заархивирует файлы
3. ✅ Загрузит на сервер
4. ✅ Распакует в `/var/www/eglavbuh`
5. ✅ Установит права
6. ✅ Перезагрузит Nginx

---

## Вариант 2: Ручной деплой

### Шаг 1: Создание build

```bash
cd /Users/alejka1337/Desktop/buhassistant
npx expo export --platform web
```

### Шаг 2: Архивирование

```bash
cd dist
tar -czf ../web-build.tar.gz .
cd ..
```

### Шаг 3: Загрузка на сервер

```bash
scp web-build.tar.gz ubuntu@api.eglavbuh.com.ua:/tmp/
```

### Шаг 4: Распаковка на сервере

```bash
# Подключиться к серверу
ssh ubuntu@api.eglavbuh.com.ua

# Создать директорию
sudo mkdir -p /var/www/eglavbuh

# Очистить старые файлы
sudo rm -rf /var/www/eglavbuh/*

# Распаковать
sudo tar -xzf /tmp/web-build.tar.gz -C /var/www/eglavbuh

# Установить права
sudo chown -R www-data:www-data /var/www/eglavbuh
sudo chmod -R 755 /var/www/eglavbuh

# Удалить временный архив
rm /tmp/web-build.tar.gz
```

### Шаг 5: Настройка Nginx

```bash
# Загрузить конфигурацию
sudo nano /etc/nginx/sites-available/eglavbuh-web
```

Вставить содержимое из `nginx-web.conf`, затем:

```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/eglavbuh-web /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить Nginx
sudo systemctl reload nginx
```

---

## Проверка деплоя

### 1. Проверить доступность сайта

```bash
# HTTP редирект на HTTPS
curl -I http://eglavbuh.com.ua

# HTTPS
curl -I https://eglavbuh.com.ua
```

### 2. Проверить статические файлы

```bash
# Favicon
curl -I https://eglavbuh.com.ua/favicon.svg

# Manifest
curl -I https://eglavbuh.com.ua/manifest.json

# JS бандл
curl -I https://eglavbuh.com.ua/_expo/static/js/web/entry-*.js
```

### 3. Проверить в браузере

Открыть:
- https://eglavbuh.com.ua
- https://www.eglavbuh.com.ua

Проверить:
- ✅ Favicon отображается
- ✅ Все страницы загружаются
- ✅ Навигация работает
- ✅ API запросы идут на `https://api.eglavbuh.com.ua`

---

## Структура файлов на сервере

```
/var/www/eglavbuh/
├── index.html              ← Главная страница
├── _expo/                  ← Expo статические файлы
│   └── static/
│       ├── js/
│       │   └── web/
│       │       └── entry-*.js
│       └── css/
├── favicon.svg             ← Favicon
├── favicon.png             ← PNG fallback
├── apple-touch-icon.png    ← Apple Touch Icon
├── manifest.json           ← PWA manifest
├── assets/                 ← Изображения
│   └── images/
└── [другие статические файлы]
```

---

## Мониторинг логов

### Логи Nginx

```bash
# Access log
sudo tail -f /var/log/nginx/eglavbuh-web-access.log

# Error log
sudo tail -f /var/log/nginx/eglavbuh-web-error.log
```

### Проверка статуса Nginx

```bash
sudo systemctl status nginx
```

---

## Автоматические обновления

### Создать cron job для SSL сертификатов

```bash
# Редактировать crontab
sudo crontab -e

# Добавить строку (проверка каждый день в 3 AM)
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## Откат к предыдущей версии

### Сохранить резервную копию перед деплоем

```bash
# На сервере
sudo cp -r /var/www/eglavbuh /var/www/eglavbuh.backup.$(date +%Y%m%d-%H%M%S)
```

### Восстановление из резервной копии

```bash
# Найти резервную копию
ls -la /var/www/ | grep eglavbuh.backup

# Восстановить
sudo rm -rf /var/www/eglavbuh
sudo cp -r /var/www/eglavbuh.backup.YYYYMMDD-HHMMSS /var/www/eglavbuh
sudo systemctl reload nginx
```

---

## Troubleshooting

### Проблема: 502 Bad Gateway

**Решение:**
```bash
# Проверить Nginx
sudo nginx -t
sudo systemctl status nginx

# Перезапустить Nginx
sudo systemctl restart nginx
```

### Проблема: 404 для всех роутов кроме главной

**Причина:** Не настроен `try_files` для SPA

**Решение:**
```bash
# Проверить в nginx конфигурации:
location / {
    try_files $uri $uri/ /index.html;
}
```

### Проблема: Файлы не обновляются

**Решение:**
```bash
# Очистить кэш браузера
# Или добавить версию в URL при деплое

# На сервере очистить старые файлы
sudo rm -rf /var/www/eglavbuh/*
# Затем снова развернуть
```

### Проблема: SSL сертификат не работает

**Решение:**
```bash
# Проверить сертификат
sudo certbot certificates

# Обновить сертификат
sudo certbot renew --dry-run

# Если нужно, перевыпустить
sudo certbot --nginx -d eglavbuh.com.ua -d www.eglavbuh.com.ua --force-renewal
```

---

## Оптимизация производительности

### 1. Включить Brotli compression (опционально)

```bash
# Установить модуль
sudo apt install nginx-module-brotli

# Добавить в nginx.conf
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
```

### 2. Настроить кэширование

Уже настроено в `nginx-web.conf`:
- Статические файлы: 1 год
- HTML: без кэша
- Manifest/Favicon: 1 день

### 3. Мониторинг размера bundle

```bash
# Проверить размер JS бандла
cd /var/www/eglavbuh/_expo/static/js/web/
ls -lh entry-*.js

# Оптимизировать если > 5MB:
# - Включить code splitting
# - Убрать неиспользуемые зависимости
# - Использовать dynamic imports
```

---

## Следующие шаги

После успешного деплоя:

1. ✅ Настроить мониторинг (Uptime Robot, Pingdom)
2. ✅ Настроить Google Analytics / Yandex.Metrica
3. ✅ Добавить в Google Search Console
4. ✅ Протестировать на разных устройствах
5. ✅ Оптимизировать SEO (добавить sitemap.xml, robots.txt)

---

## Контакты для поддержки

- **Домен:** eglavbuh.com.ua
- **API:** api.eglavbuh.com.ua
- **Email:** manager@eglavbuh.com.ua

