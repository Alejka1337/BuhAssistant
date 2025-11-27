#!/bin/bash

# eGlavBuh Production Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting eGlavBuh deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from env.production.template"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Pull latest code (if using git)
if [ -d .git ]; then
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main || git pull origin master
    echo -e "${GREEN}✅ Code updated${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional, uncomment if needed)
# echo -e "${YELLOW}🗑️  Removing old images...${NC}"
# docker-compose -f docker-compose.prod.yml rm -f

# Build new images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
echo -e "${GREEN}✅ Migrations applied${NC}"

# Check container status
echo -e "${YELLOW}🔍 Checking container status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo -e "${YELLOW}📋 Recent logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 To view logs: docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}🔄 To restart: docker-compose -f docker-compose.prod.yml restart${NC}"
echo -e "${YELLOW}🛑 To stop: docker-compose -f docker-compose.prod.yml down${NC}"

