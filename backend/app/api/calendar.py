"""
API endpoints для календаря бухгалтерских отчетов
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from app.schemas.calendar import (
    CalendarResponse,
    AvailablePeriodsResponse
)
from app.services.calendar_service import calendar_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/", response_model=CalendarResponse)
async def get_calendar():
    """
    Получить все события календаря бухгалтерских отчетов
    
    **Возвращает:**
    - Список всех событий календаря до конца 2025 года
    - Поле `who` теперь массив категорий
    
    **Пример запроса:**
    ```
    GET /api/calendar/
    ```
    
    **Пример ответа:**
    ```json
    {
        "total": 200,
        "events": [
            {
                "date": "03.11.25",
                "type": "Статистика",
                "title": "Звіт про збирання врожаю сільськогосподарських культур",
                "who": ["Агро підприємства", "Фермери"]
            }
        ]
    }
    ```
    """
    try:
        logger.info("Fetching all calendar events")
        
        events = calendar_service.get_all_calendar_events()
        
        return CalendarResponse(
            events=events,
            total=len(events)
        )
        
    except FileNotFoundError as e:
        logger.warning(f"Calendar file not found: {e}")
        raise HTTPException(
            status_code=404,
            detail="Файл календаря не знайдено"
        )
    except ValueError as e:
        logger.error(f"Invalid calendar data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Помилка завантаження календаря: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching calendar: {e}")
        raise HTTPException(
            status_code=500,
            detail="Внутрішня помилка сервера"
        )


@router.get("/available-months", response_model=AvailablePeriodsResponse)
async def get_available_months():
    """
    Получить список доступных месяцев/годов в календаре
    
    **Возвращает:**
    - Список объектов с полями `month` и `year`
    - Отсортирован по дате (от старых к новым)
    
    **Пример ответа:**
    ```json
    {
        "periods": [
            {"month": 10, "year": 2025},
            {"month": 11, "year": 2025},
            {"month": 12, "year": 2025}
        ]
    }
    ```
    
    **Использование:**
    Этот endpoint полезен для:
    - Отображения доступных периодов в UI
    - Проверки наличия данных перед запросом
    - Построения навигации по календарю
    """
    try:
        logger.info("Fetching available calendar periods")
        
        periods = calendar_service.get_available_periods()
        
        logger.info(f"Found {len(periods)} available periods")
        
        return AvailablePeriodsResponse(periods=periods)
        
    except Exception as e:
        logger.error(f"Error fetching available periods: {e}")
        raise HTTPException(
            status_code=500,
            detail="Помилка отримання доступних періодів"
        )


@router.get("/health")
async def calendar_health_check():
    """
    Проверка работоспособности календарного API
    
    **Возвращает:**
    - Статус сервиса
    - Количество событий в календаре
    """
    try:
        events = calendar_service.get_all_calendar_events()
        
        return {
            "status": "healthy",
            "service": "calendar",
            "total_events": len(events),
            "sample_event": events[0].model_dump() if len(events) > 0 else None
        }
    except Exception as e:
        logger.error(f"Calendar health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "calendar",
            "error": str(e)
        }

