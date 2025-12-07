"""
Главный файл FastAPI приложения
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.api import health, search, news, calendar, auth, consultation, profile, push, forum, reports, blocks, articles, uploads, media

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
app.include_router(auth.router, tags=["auth"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(calendar.router, tags=["calendar"])
app.include_router(consultation.router, tags=["consultation"])
app.include_router(profile.router, tags=["profile"])
app.include_router(push.router, tags=["push-notifications"])
app.include_router(forum.router, tags=["forum"])
app.include_router(reports.router, tags=["reports"])
app.include_router(blocks.router, tags=["blocks"])
app.include_router(articles.router, tags=["articles"])
app.include_router(uploads.router, prefix="/api", tags=["uploads"])
app.include_router(media.router, prefix="/api", tags=["media"])

# Настройка статических файлов для обслуживания загруженных медиа
import os
if os.path.exists("/app/app"):  # Мы в Docker
    STATIC_DIR = Path("/app/static")
else:  # Локальная разработка
    STATIC_DIR = Path(__file__).parent.parent / "static"

STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


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

