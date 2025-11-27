# 🚀 AWS Simple Deployment - eGlavBuh (All-in-One EC2)

## 💰 Экономичное решение: Все на одном EC2

Вместо использования отдельных сервисов (RDS, ElastiCache), развернем:
- ✅ **PostgreSQL** - в Docker контейнере на EC2
- ✅ **Redis** - в Docker контейнере на EC2
- ✅ **FastAPI** - в Docker контейнере на EC2
- ✅ **Celery + Celery Beat** - в Docker контейнерах на EC2
- ✅ **Nginx** - на EC2 (reverse proxy + SSL)

**Стоимость: ~$15-30/месяц** (вместо $70-90)

---

## 🎯 Этап 1: Создание EC2 Instance

### 1.1 Параметры инстанса

```
Name: eglavbuh-all-in-one

AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type

Instance type: t3.medium (2 vCPU, 4 GB RAM)
# Для MVP достаточно, можно масштабировать позже

Key pair:
- Create new: eglavbuh-key
- Type: RSA
- Format: .pem
- ⚠️ СКАЧАТЬ И СОХРАНИТЬ!

Network settings:
- VPC: default (или создать новый)
- Subnet: No preference
- Auto-assign public IP: Enable
- Firewall (Security Group): Create new
  ✅ SSH (22) - My IP (только ваш IP!)
  ✅ HTTP (80) - Anywhere (0.0.0.0/0)
  ✅ HTTPS (443) - Anywhere (0.0.0.0/0)

Storage:
- 40 GB gp3 (увеличено для БД)
- Delete on termination: Yes

Advanced details:
- Enable detailed monitoring: No (для экономии)
- User data: (оставить пустым)
```

### 1.2 Elastic IP (рекомендуется)

```
# После создания EC2, выделить Elastic IP
EC2 → Elastic IPs → Allocate Elastic IP address

# Ассоциировать с инстансом
Actions → Associate Elastic IP address
Instance: eglavbuh-all-in-one

✅ Теперь IP не изменится при перезапуске!
```

---

## 🎯 Этап 2: Подключение и начальная настройка

### 2.1 Подключение к EC2

```bash
# Изменить права на ключ
chmod 400 eglavbuh-key.pem

# Подключиться
ssh -i eglavbuh-key.pem ubuntu@[EC2_ELASTIC_IP]
```

### 2.2 Запуск setup скрипта

```bash
# Загрузить скрипт (или скопировать с локальной машины)
wget https://raw.githubusercontent.com/YOUR_REPO/main/backend/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# Выйти и войти снова (для docker group)
exit
ssh -i eglavbuh-key.pem ubuntu@[EC2_ELASTIC_IP]
```

---

## 🎯 Этап 3: Подготовка приложения

### 3.1 Клонирование репозитория

```bash
# Создать директорию приложения
sudo mkdir -p /var/www/eglavbuh
sudo chown ubuntu:ubuntu /var/www/eglavbuh
cd /var/www/eglavbuh

# Клонировать репозиторий
git clone [YOUR_GITHUB_REPO] .
# ИЛИ загрузить через SCP:
# scp -i eglavbuh-key.pem -r /local/path/buhassistant ubuntu@[EC2_IP]:/var/www/eglavbuh
```

### 3.2 Создание production .env

```bash
cd backend
cp env.production.template .env
nano .env
```

**Минимальный .env для All-in-One:**

```env
# Application
APP_NAME=eGlavBuh API
APP_VERSION=1.0.0
DEBUG=False

# Database (внутри Docker network)
DATABASE_URL=postgresql://eglavbuh_user:YOUR_STRONG_PASSWORD_HERE@postgres:5432/eglavbuh_db

# Redis (внутри Docker network)
REDIS_URL=redis://:YOUR_REDIS_PASSWORD_HERE@redis:6379/0

# Elasticsearch (опционально, можно отключить)
# ELASTICSEARCH_URL=http://elasticsearch:9200

# JWT (сгенерировать: openssl rand -hex 32)
SECRET_KEY=YOUR_32_CHAR_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google Custom Search API
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CX=your-google-cx

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=dmitrjialekseev16@gmail.com
SMTP_PASSWORD=maxrgkgeggjxysek

# CORS
ALLOWED_ORIGINS=https://eglavbuh.com.ua,https://api.eglavbuh.com.ua

# Celery (внутри Docker network)
CELERY_BROKER_URL=redis://:YOUR_REDIS_PASSWORD_HERE@redis:6379/1
CELERY_RESULT_BACKEND=redis://:YOUR_REDIS_PASSWORD_HERE@redis:6379/2

# Passwords для Docker Compose
POSTGRES_USER=eglavbuh_user
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
POSTGRES_DB=eglavbuh_db
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE
```

### 3.3 Генерация паролей

```bash
# Сгенерировать SECRET_KEY
openssl rand -hex 32

# Сгенерировать пароли для PostgreSQL и Redis
openssl rand -base64 24
openssl rand -base64 24
```

---

## 🎯 Этап 4: Docker Compose для All-in-One

### 4.1 Создать docker-compose.all-in-one.yml

```bash
cd /var/www/eglavbuh/backend
nano docker-compose.all-in-one.yml
```

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: eglavbuh_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - eglavbuh-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: eglavbuh_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - eglavbuh-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Backend
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eglavbuh_backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./data:/app/data:ro
      - ./logs:/app/logs
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
    networks:
      - eglavbuh-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Celery Worker
  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eglavbuh_celery_worker
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      - redis
      - postgres
    volumes:
      - ./data:/app/data:ro
      - ./logs:/app/logs
    command: celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
    networks:
      - eglavbuh-network

  # Celery Beat
  celery_beat:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eglavbuh_celery_beat
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      - redis
      - postgres
    volumes:
      - ./data:/app/data:ro
      - ./logs:/app/logs
      - celery_beat_data:/app/celerybeat-schedule
    command: celery -A app.celery_app.celery_app beat --loglevel=info
    networks:
      - eglavbuh-network

networks:
  eglavbuh-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  celery_beat_data:
    driver: local
```

---

## 🎯 Этап 5: Deployment

### 5.1 Первый запуск

```bash
cd /var/www/eglavbuh/backend

# Собрать и запустить
docker-compose -f docker-compose.all-in-one.yml up -d --build

# Проверить статус
docker-compose -f docker-compose.all-in-one.yml ps

# Посмотреть логи
docker-compose -f docker-compose.all-in-one.yml logs -f
```

### 5.2 Применить миграции БД

```bash
# Дождаться запуска PostgreSQL (10-20 сек)
sleep 20

# Применить миграции
docker-compose -f docker-compose.all-in-one.yml exec backend alembic upgrade head

# Проверить, что БД работает
docker-compose -f docker-compose.all-in-one.yml exec postgres psql -U eglavbuh_user -d eglavbuh_db -c "\dt"
```

### 5.3 Проверка работоспособности

```bash
# Health check
curl http://localhost:8000/health

# API docs
curl http://localhost:8000/docs

# Проверить Redis
docker-compose -f docker-compose.all-in-one.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD ping
```

---

## 🎯 Этап 6: Nginx + SSL

### 6.1 Установка Nginx конфигурации

```bash
# Скопировать конфиг
sudo cp /var/www/eglavbuh/backend/nginx.conf /etc/nginx/sites-available/eglavbuh-api

# Создать symlink
sudo ln -s /etc/nginx/sites-available/eglavbuh-api /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

### 6.2 Настройка DNS

В **Route 53** (или у регистратора домена):

```
Type: A
Name: api.eglavbuh.com.ua
Value: [EC2_ELASTIC_IP]
TTL: 300
```

Подождать 5-15 минут для распространения DNS:

```bash
# Проверить
nslookup api.eglavbuh.com.ua
```

### 6.3 Установка SSL сертификата

```bash
# Получить Let's Encrypt сертификат
sudo certbot --nginx -d api.eglavbuh.com.ua

# Email: ваш email
# Agree to terms: Yes
# Redirect HTTP to HTTPS: Yes

# Проверить автообновление
sudo certbot renew --dry-run
```

---

## 🎯 Этап 7: Бэкапы и мониторинг

### 7.1 Настройка автоматических бэкапов

```bash
# Создать директорию для бэкапов
sudo mkdir -p /var/backups/eglavbuh
sudo chown ubuntu:ubuntu /var/backups/eglavbuh

# Создать скрипт бэкапа
nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR=/var/backups/eglavbuh
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER=eglavbuh_postgres

# PostgreSQL backup
docker exec $DB_CONTAINER pg_dump -U eglavbuh_user eglavbuh_db > $BACKUP_DIR/db_backup_$DATE.sql

# Сжать
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Удалить старые бэкапы (старше 7 дней)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Сделать исполняемым
chmod +x /home/ubuntu/backup.sh

# Добавить в cron (каждый день в 3:00 AM)
crontab -e
# Добавить строку:
0 3 * * * /home/ubuntu/backup.sh >> /var/log/backup.log 2>&1
```

### 7.2 Мониторинг ресурсов

```bash
# Установить htop
sudo apt install htop -y

# Проверить использование ресурсов
htop

# Проверить размер томов Docker
docker system df -v

# Очистка старых образов (по необходимости)
docker system prune -a --volumes
```

---

## 🎯 Этап 8: Скрипты управления

### 8.1 Скрипт deploy (обновленный)

```bash
cd /var/www/eglavbuh/backend
nano deploy-all-in-one.sh
```

```bash
#!/bin/bash
set -e

echo "🚀 Deploying eGlavBuh All-in-One..."

# Pull latest code
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull origin main || git pull origin master
fi

# Backup database before deployment
echo "💾 Creating database backup..."
/home/ubuntu/backup.sh

# Stop containers
echo "🛑 Stopping containers..."
docker-compose -f docker-compose.all-in-one.yml down

# Build and start
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.all-in-one.yml up -d --build

# Wait for services
echo "⏳ Waiting for services..."
sleep 15

# Run migrations
echo "📊 Running migrations..."
docker-compose -f docker-compose.all-in-one.yml exec -T backend alembic upgrade head

# Check status
echo "🔍 Container status:"
docker-compose -f docker-compose.all-in-one.yml ps

echo "✅ Deployment completed!"
```

```bash
chmod +x deploy-all-in-one.sh
```

---

## 📋 Полезные команды

### Управление сервисами

```bash
cd /var/www/eglavbuh/backend

# Посмотреть статус
docker-compose -f docker-compose.all-in-one.yml ps

# Посмотреть логи
docker-compose -f docker-compose.all-in-one.yml logs -f backend
docker-compose -f docker-compose.all-in-one.yml logs -f celery_worker
docker-compose -f docker-compose.all-in-one.yml logs -f postgres

# Перезапустить сервис
docker-compose -f docker-compose.all-in-one.yml restart backend

# Перезапустить все
docker-compose -f docker-compose.all-in-one.yml restart

# Остановить все
docker-compose -f docker-compose.all-in-one.yml down

# Запустить заново
docker-compose -f docker-compose.all-in-one.yml up -d
```

### Работа с БД

```bash
# Войти в PostgreSQL
docker-compose -f docker-compose.all-in-one.yml exec postgres psql -U eglavbuh_user -d eglavbuh_db

# Список таблиц
\dt

# Выйти
\q

# Ручной бэкап
docker exec eglavbuh_postgres pg_dump -U eglavbuh_user eglavbuh_db > backup.sql

# Восстановление
docker exec -i eglavbuh_postgres psql -U eglavbuh_user -d eglavbuh_db < backup.sql
```

### Работа с Redis

```bash
# Подключиться к Redis
docker-compose -f docker-compose.all-in-one.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD

# Проверить ключи Celery
KEYS celery-*

# Очистить все ключи (ОСТОРОЖНО!)
FLUSHALL

# Выйти
exit
```

---

## 💰 Стоимость (USD/месяц)

```
EC2 t3.medium: ~$30
Elastic IP: $0 (пока привязан к EC2)
EBS 40GB: ~$4
Route 53: ~$1
Data transfer: ~$5

Итого: ~$40/месяц
```

**Экономия: ~$30-50/месяц** по сравнению с отдельными RDS + ElastiCache!

---

## 🔄 Миграция на managed services (будущее)

Когда приложение вырастет, можно легко мигрировать:

### На RDS PostgreSQL:
1. Создать RDS instance
2. Сделать dump: `pg_dump > backup.sql`
3. Восстановить на RDS: `psql < backup.sql`
4. Обновить `DATABASE_URL` в `.env`
5. Перезапустить контейнеры

### На ElastiCache Redis:
1. Создать ElastiCache cluster
2. Обновить `REDIS_URL` в `.env`
3. Перезапустить контейнеры
4. Redis данные не критичны (кеш + celery)

---

## 🔐 Security Checklist

- [x] SSH только с вашего IP
- [x] Сильные пароли для PostgreSQL и Redis
- [x] SSL/TLS сертификат (HTTPS)
- [x] Firewall настроен (только 22, 80, 443)
- [x] Регулярные бэкапы (cron)
- [x] Docker volumes для persistence
- [x] Логи ротируются

---

## 📊 Мониторинг производительности

```bash
# Использование диска
df -h

# Использование памяти
free -h

# Использование CPU и RAM по контейнерам
docker stats

# Размер БД
docker-compose -f docker-compose.all-in-one.yml exec postgres psql -U eglavbuh_user -d eglavbuh_db -c "SELECT pg_size_pretty(pg_database_size('eglavbuh_db'));"

# Логи Nginx
sudo tail -f /var/log/nginx/eglavbuh-api-access.log
sudo tail -f /var/log/nginx/eglavbuh-api-error.log
```

---

## 🎉 Готово!

**API доступен:** https://api.eglavbuh.com.ua

**Преимущества All-in-One:**
- ✅ Дешевле (~$40 вместо $90)
- ✅ Проще в управлении
- ✅ Быстрое развертывание
- ✅ Легко мигрировать на managed services позже

**Недостатки:**
- ⚠️ Все на одном сервере (single point of failure)
- ⚠️ Нужно больше места на диске для БД
- ⚠️ Ручное масштабирование

**Рекомендация:** Отлично подходит для MVP и до ~1000-5000 активных пользователей!

---

**Следующие шаги:**
1. ✅ Backend работает на EC2
2. ⏳ Обновить frontend с API URL
3. ⏳ Протестировать все функции
4. ⏳ Мониторить производительность
5. ⏳ При необходимости - мигрировать на RDS + ElastiCache

