"""
Pydantic схемы для календаря бухгалтерских отчетов
"""
from pydantic import BaseModel, Field
from typing import List


class CalendarEvent(BaseModel):
    """Одно событие в календаре"""
    date: str = Field(..., description="Дата в формате DD.MM.YY или DD.MM.YYYY")
    type: str = Field(..., description="Тип отчета (Статистика, Податки, ДПС, и т.д.)")
    title: str = Field(..., description="Название отчета")
    who: List[str] = Field(..., description="Кто подает отчет (список категорий)")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "03.11.25",
                "type": "Статистика",
                "title": "Звіт про збирання врожаю сільськогосподарських культур",
                "who": ["Агро підприємства", "Фермери"]
            }
        }


class CalendarResponse(BaseModel):
    """Ответ API с событиями календаря"""
    events: List[CalendarEvent] = Field(default_factory=list, description="Список всех событий")
    total: int = Field(..., description="Общее количество событий")

    class Config:
        json_schema_extra = {
            "example": {
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
        }


class AvailablePeriod(BaseModel):
    """Доступный период в календаре"""
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2100)

    class Config:
        json_schema_extra = {
            "example": {
                "month": 10,
                "year": 2025
            }
        }


class AvailablePeriodsResponse(BaseModel):
    """Список доступных периодов"""
    periods: List[AvailablePeriod] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "periods": [
                    {"month": 10, "year": 2025},
                    {"month": 11, "year": 2025}
                ]
            }
        }

