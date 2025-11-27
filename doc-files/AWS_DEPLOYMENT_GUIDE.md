# 🚀 AWS Deployment Guide - eGlavBuh

## 📋 Обзор инфраструктуры

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet/Users                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Route 53 (DNS Management)                       │
│  - eglavbuh.com.ua → S3 (будущий web)                      │
│  - api.eglavbuh.com.ua → EC2 (backend)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CloudFront (CDN) - опционально                  │
│  - Кеширование статики                                       │
│  - SSL/TLS termination                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│   EC2 Instance   │         │   S3 Bucket      │
│   (Backend API)  │         │   (Static Files) │
│                  │         │                  │
│ - Docker         │         │ - Images         │
│ - Nginx          │         │ - Documents      │
│ - FastAPI        │         │                  │
│ - Celery         │         └──────────────────┘
│ - Celery Beat    │
└────────┬─────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌──────────────────┐ ┌──────────────────┐
│  RDS PostgreSQL  │ │ ElastiCache Redis│
│  (Database)      │ │ (Cache + Celery) │
│                  │ │                  │
│ - db.t3.micro    │ │ - cache.t3.micro │
│ - Automated      │ │ - Pub/Sub        │
│   backups        │ │ - Session store  │
└──────────────────┘ └──────────────────┘
```

---

## 🎯 Этап 1: Подготовка AWS Account

### 1.1 Создание AWS аккаунта
1. Перейти на https://aws.amazon.com/
2. Нажать "Create an AWS Account"
3. Заполнить данные (email, пароль, имя аккаунта)
4. Ввести платежную информацию (кредитная карта)
5. Подтвердить телефон
6. Выбрать план: **Basic Support (Free)**

### 1.2 Настройка IAM пользователя
```bash
# Не используйте root аккаунт для повседневной работы!
# Создайте IAM пользователя с ограниченными правами
```

1. Войти в AWS Console
2. Перейти в **IAM** → **Users** → **Create user**
3. Имя: `eglavbuh-admin`
4. Включить: **AWS Management Console access**
5. Прикрепить политики:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonElastiCacheFullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AmazonRoute53FullAccess`
6. Сохранить credentials!

### 1.3 Настройка AWS CLI (локально)
```bash
# Установить AWS CLI
brew install awscli  # macOS
# или
pip install awscli

# Настроить credentials
aws configure
# AWS Access Key ID: [ваш ключ]
# AWS Secret Access Key: [ваш секрет]
# Default region name: eu-central-1  # Frankfurt (ближе к Украине)
# Default output format: json
```

---

## 🎯 Этап 2: VPC и Security Groups

### 2.1 Создание VPC (опционально, можно использовать default)
```bash
# По умолчанию AWS создает VPC автоматически
# Для простоты используем default VPC
```

### 2.2 Security Groups

#### SG 1: Backend EC2
```
Name: eglavbuh-backend-sg
Inbound Rules:
- Type: HTTP, Port: 80, Source: 0.0.0.0/0 (Anywhere)
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0 (Anywhere)
- Type: SSH, Port: 22, Source: [ВАШ IP]/32 (только ваш IP!)
- Type: Custom TCP, Port: 8000, Source: 0.0.0.0/0 (FastAPI для теста)

Outbound Rules:
- All traffic (по умолчанию)
```

#### SG 2: RDS PostgreSQL
```
Name: eglavbuh-rds-sg
Inbound Rules:
- Type: PostgreSQL, Port: 5432, Source: eglavbuh-backend-sg (только EC2)

Outbound Rules:
- All traffic
```

#### SG 3: ElastiCache Redis
```
Name: eglavbuh-redis-sg
Inbound Rules:
- Type: Custom TCP, Port: 6379, Source: eglavbuh-backend-sg (только EC2)

Outbound Rules:
- All traffic
```

---

## 🎯 Этап 3: RDS PostgreSQL

### 3.1 Создание RDS Instance
```
Engine: PostgreSQL
Version: 15.x (latest stable)
Template: Free tier (для начала) или Production

Settings:
- DB instance identifier: eglavbuh-db
- Master username: eglavbuh_admin
- Master password: [СИЛЬНЫЙ ПАРОЛЬ - сохраните!]

Instance configuration:
- db.t3.micro (Free tier) или db.t3.small

Storage:
- Storage type: General Purpose SSD (gp3)
- Allocated storage: 20 GB
- Enable storage autoscaling: Yes
- Maximum storage threshold: 100 GB

Connectivity:
- VPC: default (или созданный)
- Subnet group: default
- Public access: No (только из VPC)
- VPC security group: eglavbuh-rds-sg
- Availability Zone: No preference

Database authentication:
- Password authentication

Additional configuration:
- Initial database name: eglavbuh_db
- Backup retention period: 7 days
- Enable automated backups: Yes
- Enable encryption: Yes
```

### 3.2 После создания
```bash
# Сохранить Endpoint URL (будет примерно так):
# eglavbuh-db.xxxxxxxxxx.eu-central-1.rds.amazonaws.com

# Connection string для .env:
DATABASE_URL=postgresql://eglavbuh_admin:PASSWORD@eglavbuh-db.xxxxxxxxxx.eu-central-1.rds.amazonaws.com:5432/eglavbuh_db
```

---

## 🎯 Этап 4: ElastiCache Redis

### 4.1 Создание Redis Cluster
```
Engine: Redis
Location: AWS Cloud

Redis settings:
- Cluster mode: Disabled (простая настройка)
- Name: eglavbuh-redis
- Engine version: 7.x

Cluster settings:
- Node type: cache.t3.micro (Free tier eligible)
- Number of replicas: 0 (для начала)

Subnet group:
- Create new: eglavbuh-redis-subnet-group
- VPC: default
- Subnets: выбрать 2-3 subnet в разных AZ

Security:
- Security groups: eglavbuh-redis-sg
- Encryption at rest: Yes (recommended)
- Encryption in transit: Yes (recommended)

Backup:
- Enable automatic backups: Yes
- Backup retention period: 5 days
```

### 4.2 После создания
```bash
# Сохранить Primary Endpoint:
# eglavbuh-redis.xxxxxx.0001.euc1.cache.amazonaws.com:6379

# Connection strings для .env:
REDIS_URL=redis://eglavbuh-redis.xxxxxx.0001.euc1.cache.amazonaws.com:6379/0
CELERY_BROKER_URL=redis://eglavbuh-redis.xxxxxx.0001.euc1.cache.amazonaws.com:6379/1
CELERY_RESULT_BACKEND=redis://eglavbuh-redis.xxxxxx.0001.euc1.cache.amazonaws.com:6379/2
```

---

## 🎯 Этап 5: EC2 Instance (Backend)

### 5.1 Launch EC2 Instance
```
Name: eglavbuh-backend

AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type

Instance type: t3.medium (2 vCPU, 4 GB RAM)
# Можно начать с t3.small, но medium рекомендуется для production

Key pair:
- Create new: eglavbuh-key
- Type: RSA
- Format: .pem
- СКАЧАТЬ И СОХРАНИТЬ!

Network settings:
- VPC: default
- Subnet: No preference
- Auto-assign public IP: Enable
- Security group: eglavbuh-backend-sg

Storage:
- 30 GB gp3
- Delete on termination: Yes

Advanced details:
- User data: (оставить пустым, настроим вручную)
```

### 5.2 Подключение к EC2
```bash
# Изменить права на ключ
chmod 400 eglavbuh-key.pem

# Подключиться через SSH
ssh -i eglavbuh-key.pem ubuntu@[EC2_PUBLIC_IP]
```

### 5.3 Установка Docker на EC2
```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker ubuntu

# Выйти и снова войти для применения
exit
ssh -i eglavbuh-key.pem ubuntu@[EC2_PUBLIC_IP]

# Проверить
docker --version
```

### 5.4 Установка Docker Compose
```bash
# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# Проверить
docker-compose --version
```

### 5.5 Установка Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🎯 Этап 6: Deploy Backend на EC2

### 6.1 Клонирование репозитория
```bash
# Установить git
sudo apt install git -y

# Клонировать репозиторий (или загрузить через scp/rsync)
git clone [ВАШ_РЕПОЗИТОРИЙ] /home/ubuntu/eglavbuh
cd /home/ubuntu/eglavbuh
```

### 6.2 Создание production .env
```bash
cd backend
nano .env

# Вставить содержимое из env.production.template
# Заполнить все реальные значения:
# - DATABASE_URL (из RDS)
# - REDIS_URL (из ElastiCache)
# - SECRET_KEY (сгенерировать: openssl rand -hex 32)
# - API keys
# - SMTP credentials
```

### 6.3 Запуск Docker Compose
```bash
# Production docker-compose файл
docker-compose -f docker-compose.prod.yml up -d

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

### 6.4 Миграции БД
```bash
# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 🎯 Этап 7: Nginx Configuration

### 7.1 Создать конфиг для api.eglavbuh.com.ua
```bash
sudo nano /etc/nginx/sites-available/eglavbuh-api
```

```nginx
server {
    listen 80;
    server_name api.eglavbuh.com.ua;

    # Редирект на HTTPS (после установки SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Включить конфиг
sudo ln -s /etc/nginx/sites-available/eglavbuh-api /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

---

## 🎯 Этап 8: SSL Certificate (Let's Encrypt)

### 8.1 Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 8.2 Получение сертификата
```bash
# ВАЖНО: DNS должен быть настроен на EC2 IP!
sudo certbot --nginx -d api.eglavbuh.com.ua

# Следовать инструкциям
# Email: ваш email
# Agree to terms: Yes
# Redirect HTTP to HTTPS: Yes
```

### 8.3 Автообновление сертификата
```bash
# Certbot автоматически добавляет cron job
# Проверить:
sudo certbot renew --dry-run
```

---

## 🎯 Этап 9: S3 + CloudFront (для статики)

### 9.1 Создание S3 Bucket
```
Bucket name: eglavbuh-static
Region: eu-central-1
Block all public access: OFF (для CloudFront)

Bucket versioning: Disabled
Encryption: Enable (AES-256)
```

### 9.2 Создание CloudFront Distribution
```
Origin domain: eglavbuh-static.s3.eu-central-1.amazonaws.com
Origin path: (оставить пустым)
Name: eGlavBuh Static

Origin access: Legacy access identities
- Create new OAI
- Update bucket policy: Yes

Viewer protocol policy: Redirect HTTP to HTTPS
Allowed HTTP methods: GET, HEAD

Cache policy: CachingOptimized

Price class: Use all edge locations (best performance)

Alternate domain name (CNAME): static.eglavbuh.com.ua
SSL certificate: Request certificate from ACM

Custom SSL certificate:
- Request certificate in ACM (us-east-1!)
- Domain: static.eglavbuh.com.ua
- Validate via DNS (Route 53)
```

---

## 🎯 Этап 10: Route 53 (DNS)

### 10.1 Создание Hosted Zone
```
Domain name: eglavbuh.com.ua
Type: Public hosted zone
```

### 10.2 DNS Records
```
# API Backend
Type: A
Name: api.eglavbuh.com.ua
Value: [EC2 ELASTIC IP]
TTL: 300

# Static CDN
Type: CNAME
Name: static.eglavbuh.com.ua
Value: [CloudFront Distribution Domain]
TTL: 300

# Main domain (будущий web)
Type: A
Name: eglavbuh.com.ua
Value: [S3 Website Endpoint или CloudFront]
TTL: 300

# WWW redirect
Type: CNAME
Name: www.eglavbuh.com.ua
Value: eglavbuh.com.ua
TTL: 300
```

### 10.3 Обновление Name Servers у регистратора
```
# Скопировать NS записи из Route 53
# Вставить в настройки домена у регистратора (reg.ua и т.д.)
```

---

## 🎯 Этап 11: Мониторинг и Бэкапы

### 11.1 CloudWatch Alarms
```
# CPU > 80%
# Memory > 80%
# Disk > 80%
# RDS connections
# Redis memory
```

### 11.2 RDS Automated Backups
```
# Уже настроено при создании RDS
# Retention: 7 days
# Backup window: предпочтительно ночью
```

### 11.3 EC2 Snapshots (опционально)
```
# Создавать snapshots EBS volume раз в неделю
```

---

## 📋 Checklist перед запуском

- [ ] RDS создан и доступен из EC2
- [ ] Redis создан и доступен из EC2
- [ ] EC2 запущен, Docker установлен
- [ ] Backend работает в Docker
- [ ] Nginx настроен как reverse proxy
- [ ] SSL сертификат установлен
- [ ] DNS настроен (api.eglavbuh.com.ua → EC2)
- [ ] Frontend обновлен с production API URL
- [ ] Все environment variables корректны
- [ ] Миграции БД применены
- [ ] Celery и Celery Beat запущены
- [ ] Логи проверены, ошибок нет

---

## 🔐 Security Best Practices

1. ✅ Не использовать root AWS аккаунт
2. ✅ Использовать IAM roles для EC2
3. ✅ RDS и Redis не доступны извне VPC
4. ✅ SSH только с вашего IP
5. ✅ Регулярные backups
6. ✅ Encryption at rest и in transit
7. ✅ Strong passwords для всех сервисов
8. ✅ Регулярные обновления системы
9. ✅ Monitoring и alerts
10. ✅ Rate limiting на API

---

## 💰 Примерная стоимость (USD/месяц)

- EC2 t3.medium: ~$30
- RDS db.t3.micro: ~$15
- ElastiCache cache.t3.micro: ~$12
- S3 + CloudFront: ~$5-10
- Route 53: ~$1
- Data transfer: ~$10-20

**Итого: ~$70-90/месяц**

*(Free tier первые 12 месяцев снижает стоимость)*

---

**Готовы начать? Создайте AWS аккаунт и переходите к Этапу 1!** 🚀

