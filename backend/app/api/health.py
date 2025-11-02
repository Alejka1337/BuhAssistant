"""
Health check endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.core.config import settings
import redis

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Базовый health check
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/health/db")
async def health_check_database(db: Session = Depends(get_db)):
    """
    Проверка подключения к PostgreSQL
    """
    try:
        # Выполняем простой запрос
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        return {
            "status": "healthy",
            "service": "postgresql",
            "message": "Database connection is working"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"
        )


@router.get("/health/redis")
async def health_check_redis():
    """
    Проверка подключения к Redis
    """
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        return {
            "status": "healthy",
            "service": "redis",
            "message": "Redis connection is working"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Redis connection failed: {str(e)}"
        )


@router.get("/health/all")
async def health_check_all(db: Session = Depends(get_db)):
    """
    Проверка всех сервисов
    """
    services = {}
    
    # Проверка PostgreSQL
    try:
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        services["postgresql"] = "healthy"
    except Exception as e:
        services["postgresql"] = f"unhealthy: {str(e)}"
    
    # Проверка Redis
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        services["redis"] = "healthy"
    except Exception as e:
        services["redis"] = f"unhealthy: {str(e)}"
    
    # Проверка Elasticsearch (опционально)
    try:
        from elasticsearch import Elasticsearch
        es = Elasticsearch([settings.ELASTICSEARCH_URL])
        if es.ping():
            services["elasticsearch"] = "healthy"
        else:
            services["elasticsearch"] = "unhealthy: ping failed"
    except Exception as e:
        services["elasticsearch"] = f"unhealthy: {str(e)}"
    
    # Определяем общий статус
    all_healthy = all(status == "healthy" for status in services.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "services": services,
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }

