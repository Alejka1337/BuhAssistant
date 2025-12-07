#!/bin/bash
# 🚀 Быстрый скрипт для деплоя на продакшн
# Использование: bash QUICK_DEPLOY.sh

set -e  # Остановить при ошибке

echo "🔍 Проверка git статуса..."
git status

echo ""
read -p "❓ Закоммитить изменения? (y/n): " commit_changes
if [ "$commit_changes" = "y" ]; then
    echo "📝 Коммит изменений..."
    git add .
    read -p "Введите сообщение коммита: " commit_msg
    git commit -m "$commit_msg"
    git push origin main
    echo "✅ Изменения отправлены в git"
fi

echo ""
read -p "🌐 Введите адрес продакшн сервера (например, root@your-server.com): " server

echo ""
echo "🚀 Подключение к $server и деплой..."

ssh $server << 'ENDSSH'
set -e

echo ""
echo "📦 Бэкап БД..."
BACKUP_FILE="/root/backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec buhassistant-postgres-1 pg_dump -U eglavbuh_user eglavbuh_db > $BACKUP_FILE
echo "✅ Бэкап создан: $BACKUP_FILE"

echo ""
echo "🔄 Обновление кода..."
cd /root/buhassistant
git pull origin main
echo "✅ Код обновлен"

echo ""
echo "🔧 Проверка .env..."
if ! grep -q "OPENAI_API_KEY" backend/.env; then
    echo "⚠️  ВНИМАНИЕ: Не найден OPENAI_API_KEY в .env!"
    echo "Добавьте вручную: nano backend/.env"
fi

echo ""
echo "📁 Создание директории для медиа..."
mkdir -p /root/buhassistant/backend/static/uploads
chmod -R 755 /root/buhassistant/backend/static
echo "✅ Директория создана"

echo ""
echo "🐳 Остановка контейнеров..."
docker-compose down
echo "✅ Контейнеры остановлены"

echo ""
echo "🔨 Пересборка backend..."
docker-compose build --no-cache backend
echo "✅ Backend пересобран"

echo ""
echo "🚀 Запуск контейнеров..."
docker-compose up -d
echo "✅ Контейнеры запущены"

echo ""
echo "⏳ Ожидание запуска backend (30 сек)..."
sleep 30

echo ""
echo "📊 Применение миграций..."
docker exec buhassistant-backend-1 alembic upgrade head
echo "✅ Миграции применены"

echo ""
echo "🔄 Перезапуск Celery..."
docker-compose restart celery celery-beat
echo "✅ Celery перезапущен"

echo ""
echo "🧪 Проверка контейнеров..."
docker-compose ps

echo ""
echo "📝 Текущая версия миграций:"
docker exec buhassistant-backend-1 alembic current

echo ""
echo "🎉 Деплой завершен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте логи: docker-compose logs -f backend --tail=50"
echo "2. Проверьте API: curl https://your-domain.com/health"
echo "3. Протестируйте основные функции (статьи, форум, модерацию)"
echo ""
echo "📞 В случае проблем:"
echo "   - Откат БД: docker exec -i buhassistant-postgres-1 psql -U eglavbuh_user eglavbuh_db < $BACKUP_FILE"
echo "   - Откат кода: git reset --hard HEAD~1"
echo ""

ENDSSH

echo ""
echo "✅ Скрипт завершен!"
echo ""
echo "🔗 SSH для мониторинга:"
echo "   ssh $server"
echo "   docker-compose logs -f --tail=100"

