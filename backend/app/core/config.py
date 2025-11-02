"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "BuhAssistant API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://buhassistant:buhassistant123@localhost:5432/buhassistant_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google OAuth2
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    
    # Expo Push Notifications
    EXPO_ACCESS_TOKEN: str = ""
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8081",
        "exp://localhost:8081",
        "http://localhost:19006",  # Expo web
    ]
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Создаем глобальный экземпляр настроек
settings = Settings()

