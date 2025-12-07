#!/bin/bash

# Скрипт для деплоя веб-версии на EC2
# Использование: ./deploy-web.sh

set -e

echo "🚀 Начинаем деплой веб-версии на EC2..."

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Конфигурация
EC2_USER="ubuntu"
EC2_HOST="api.eglavbuh.com.ua"  # Или IP адрес вашего EC2
WEB_DIR="/var/www/eglavbuh"
DIST_DIR="./dist"

echo -e "${BLUE}📦 Шаг 1: Создание production build...${NC}"
npx expo export --platform web

if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ Ошибка: директория dist не создана${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build создан успешно${NC}"

echo -e "${BLUE}🧹 Шаг 2: Очистка macOS мета-файлов...${NC}"
find dist -name "._*" -type f -delete
find dist -name ".DS_Store" -type f -delete

echo -e "${GREEN}✅ Мета-файлы удалены${NC}"

echo -e "${BLUE}📤 Шаг 3: Архивирование файлов...${NC}"
cd dist
tar -czf ../web-build.tar.gz .
cd ..

echo -e "${GREEN}✅ Архив создан${NC}"

echo -e "${BLUE}🌐 Шаг 4: Загрузка на EC2...${NC}"
scp web-build.tar.gz $EC2_USER@$EC2_HOST:~/

echo -e "${GREEN}✅ Файлы загружены на сервер${NC}"

echo -e "${BLUE}🔧 Шаг 5: Распаковка и настройка на сервере...${NC}"
ssh $EC2_USER@$EC2_HOST << 'ENDSSH'
    set -e
    
    # Создать директорию для веб-версии
    sudo mkdir -p /var/www/eglavbuh
    
    # Очистить старые файлы
    sudo rm -rf /var/www/eglavbuh/*
    
    # Распаковать новые файлы
    sudo tar -xzf ~/web-build.tar.gz -C /var/www/eglavbuh
    
    # Удалить macOS мета-файлы
    sudo find /var/www/eglavbuh -name "._*" -type f -delete
    sudo find /var/www/eglavbuh -name ".DS_Store" -type f -delete
    
    # Установить права
    sudo chown -R www-data:www-data /var/www/eglavbuh
    sudo chmod -R 755 /var/www/eglavbuh
    
    # Удалить временный архив
    rm ~/web-build.tar.gz
    
    echo "✅ Файлы распакованы и права установлены"
ENDSSH

echo -e "${GREEN}✅ Распаковка завершена${NC}"

# Удалить локальный архив
rm web-build.tar.gz

echo -e "${BLUE}🔄 Шаг 6: Перезагрузка Nginx...${NC}"
ssh $EC2_USER@$EC2_HOST << 'ENDSSH'
    sudo systemctl daemon-reload
    sudo systemctl reload nginx
    echo "✅ Nginx перезагружен"
ENDSSH

echo -e "${GREEN}✅ Nginx перезагружен${NC}"

echo ""
echo -e "${GREEN}🎉 Деплой завершен успешно!${NC}"
echo -e "${BLUE}🌐 Веб-версия доступна по адресу: https://eglavbuh.com.ua${NC}"
echo ""

