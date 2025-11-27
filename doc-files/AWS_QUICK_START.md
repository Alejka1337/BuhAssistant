# ⚡ AWS Quick Start - eGlavBuh

## 🎯 Быстрое развертывание (30-60 минут)

### Шаг 1: Создать AWS Resources (15 мин)

#### 1.1 RDS PostgreSQL
```bash
# В AWS Console → RDS → Create database
Engine: PostgreSQL 15.x
Template: Production (или Free tier для теста)
DB instance identifier: eglavbuh-db
Master username: eglavbuh_admin
Master password: [СОЗДАТЬ СИЛЬНЫЙ ПАРОЛЬ]
Instance: db.t3.micro
Storage: 20 GB, enable autoscaling
VPC: default
Public access: No
Security group: Create new "eglavbuh-rds-sg"
  - Allow PostgreSQL (5432) from eglavbuh-backend-sg

✅ Сохранить endpoint: eglavbuh-db.xxxxxxxxxx.region.rds.amazonaws.com
```

#### 1.2 ElastiCache Redis
```bash
# AWS Console → ElastiCache → Create cluster
Engine: Redis 7.x
Cluster mode: Disabled
Name: eglavbuh-redis
Node type: cache.t3.micro
Security group: Create new "eglavbuh-redis-sg"
  - Allow Redis (6379) from eglavbuh-backend-sg

✅ Сохранить endpoint: eglavbuh-redis.xxxxxx.cache.amazonaws.com:6379
```

#### 1.3 EC2 Instance
```bash
# AWS Console → EC2 → Launch instance
Name: eglavbuh-backend
AMI: Ubuntu Server 22.04 LTS
Instance type: t3.medium (или t3.small для начала)
Key pair: Create new → eglavbuh-key.pem (СКАЧАТЬ!)
Security group: Create new "eglavbuh-backend-sg"
  - SSH (22) from MY_IP
  - HTTP (80) from 0.0.0.0/0
  - HTTPS (443) from 0.0.0.0/0
  - Custom TCP (8000) from 0.0.0.0/0 (временно)
Storage: 30 GB gp3

✅ Сохранить Public IP: xx.xx.xx.xx
```

---

### Шаг 2: Настроить EC2 (10 мин)

```bash
# Локально: подключиться к EC2
chmod 400 eglavbuh-key.pem
ssh -i eglavbuh-key.pem ubuntu@[EC2_PUBLIC_IP]
```

```bash
# На EC2: загрузить и запустить setup script
wget https://raw.githubusercontent.com/YOUR_REPO/main/backend/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# Выйти и войти снова (для docker group)
exit
ssh -i eglavbuh-key.pem ubuntu@[EC2_PUBLIC_IP]
```

---

### Шаг 3: Deploy Backend (10 мин)

```bash
# На EC2: клонировать репозиторий
cd /var/www
sudo mkdir eglavbuh
sudo chown ubuntu:ubuntu eglavbuh
cd eglavbuh
git clone [YOUR_REPO] .

# Создать .env файл
cd backend
cp env.production.template .env
nano .env
```

**Заполнить .env:**
```env
DEBUG=False
DATABASE_URL=postgresql://eglavbuh_admin:PASSWORD@eglavbuh-db.xxxxxxxxxx.region.rds.amazonaws.com:5432/eglavbuh_db
REDIS_URL=redis://eglavbuh-redis.xxxxxx.cache.amazonaws.com:6379/0
CELERY_BROKER_URL=redis://eglavbuh-redis.xxxxxx.cache.amazonaws.com:6379/1
CELERY_RESULT_BACKEND=redis://eglavbuh-redis.xxxxxx.cache.amazonaws.com:6379/2
SECRET_KEY=[openssl rand -hex 32]
SMTP_EMAIL=dmitrjialekseev16@gmail.com
SMTP_PASSWORD=maxrgkgeggjxysek
GOOGLE_API_KEY=[ВАШ КЛЮЧ]
GOOGLE_CX=[ВАШ CX]
OPENAI_API_KEY=[ВАШ КЛЮЧ]
ALLOWED_ORIGINS=https://eglavbuh.com.ua,https://api.eglavbuh.com.ua
```

```bash
# Запустить deployment
chmod +x deploy.sh
./deploy.sh

# Проверить, что все работает
curl http://localhost:8000/health
```

---

### Шаг 4: Настроить Nginx (5 мин)

```bash
# На EC2: скопировать конфиг
sudo cp nginx.conf /etc/nginx/sites-available/eglavbuh-api
sudo ln -s /etc/nginx/sites-available/eglavbuh-api /etc/nginx/sites-enabled/

# Проверить и перезапустить
sudo nginx -t
sudo systemctl restart nginx

# Проверить
curl http://localhost/health
curl http://[EC2_PUBLIC_IP]/health
```

---

### Шаг 5: Настроить DNS (5 мин)

#### 5.1 В Route 53 (или у регистратора домена)
```
Type: A
Name: api.eglavbuh.com.ua
Value: [EC2_PUBLIC_IP]
TTL: 300
```

#### 5.2 Подождать распространения DNS (5-15 мин)
```bash
# Проверить
nslookup api.eglavbuh.com.ua
```

---

### Шаг 6: Установить SSL (5 мин)

```bash
# На EC2: получить Let's Encrypt сертификат
sudo certbot --nginx -d api.eglavbuh.com.ua

# Email: ваш email
# Agree: Yes
# Redirect HTTP to HTTPS: Yes

# Проверить
curl https://api.eglavbuh.com.ua/health
```

---

### Шаг 7: Обновить Frontend (5 мин)

```bash
# Локально: обновить app.json
cd /path/to/buhassistant
nano app.json
```

```json
{
  "extra": {
    "apiUrl": "https://api.eglavbuh.com.ua"
  }
}
```

```bash
# Пересобрать приложение
eas build --platform ios --profile production
```

---

## ✅ Проверка работоспособности

```bash
# 1. Health check
curl https://api.eglavbuh.com.ua/health

# 2. API docs
open https://api.eglavbuh.com.ua/docs

# 3. Регистрация тестового пользователя
curl -X POST https://api.eglavbuh.com.ua/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'

# 4. Проверить логи на EC2
ssh -i eglavbuh-key.pem ubuntu@[EC2_IP]
cd /var/www/eglavbuh/backend
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔧 Полезные команды

```bash
# На EC2:

# Перезапустить все сервисы
cd /var/www/eglavbuh/backend
docker-compose -f docker-compose.prod.yml restart

# Посмотреть логи
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery_worker
docker-compose -f docker-compose.prod.yml logs -f celery_beat

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Войти в контейнер
docker-compose -f docker-compose.prod.yml exec backend bash

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Остановить все
docker-compose -f docker-compose.prod.yml down

# Запустить заново
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🎉 Готово!

**Backend доступен:** https://api.eglavbuh.com.ua

**Следующие шаги:**
1. ✅ Backend работает на AWS
2. ⏳ Обновить приложение с новым API URL
3. ⏳ Протестировать все функции
4. ⏳ Настроить доменную почту (noreply@eglavbuh.com.ua)
5. ⏳ Настроить S3 + CloudFront для статики
6. ⏳ Опубликовать приложение в App Store

---

## 🆘 Troubleshooting

### Backend не запускается
```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs backend

# Проверить .env
cat .env | grep -v PASSWORD

# Проверить подключение к RDS
telnet eglavbuh-db.xxx.rds.amazonaws.com 5432
```

### Celery не работает
```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs celery_worker
docker-compose -f docker-compose.prod.yml logs celery_beat

# Проверить Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### SSL не работает
```bash
# Проверить Nginx
sudo nginx -t
sudo systemctl status nginx

# Проверить сертификат
sudo certbot certificates

# Обновить сертификат
sudo certbot renew --dry-run
```

---

**Нужна помощь?** Проверьте `AWS_DEPLOYMENT_GUIDE.md` для детальных инструкций! 📖

