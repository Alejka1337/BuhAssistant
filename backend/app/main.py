"""
Главный файл FastAPI приложения
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import health, search

# Создаем приложение FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Настройка CORS для React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Разрешить все методы
    allow_headers=["*"],  # Разрешить все заголовки
)

# Подключаем роутеры
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(search.router, prefix="/api/search", tags=["search"])


@app.on_event("startup")
async def startup_event():
    """
    Событие при запуске приложения
    """
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} запущен!")
    print(f"📚 Документация доступна по адресу: http://localhost:8000/api/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Событие при остановке приложения
    """
    print(f"🛑 {settings.APP_NAME} остановлен")


@app.get("/")
async def root():
    """
    Корневой endpoint
    """
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs",
    }

