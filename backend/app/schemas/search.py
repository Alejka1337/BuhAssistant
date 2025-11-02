"""
Pydantic схемы для Search API
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class SourceEnum(str, Enum):
    """Доступные источники для поиска"""
    ALL = "all"
    TAX = "tax.gov.ua"
    ZAKON = "zakon.rada.gov.ua"
    BUHGALTER911 = "buhgalter911.com.ua"
    LIGAZAKON = "ligazakon.net"
    DTKT = "dtkt.ua"
    MINFIN = "minfin.gov.ua"
    DIIA = "diia.gov.ua"


class SearchResult(BaseModel):
    """Результат поиска"""
    title: str
    description: str
    url: str
    source: str
    date: Optional[str] = None  # Дата последнего изменения

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    """Запрос на поиск"""
    query: str = Field(..., min_length=1, max_length=500, description="Поисковый запрос")
    sources: List[str] = Field(..., description="Список доменов источников или ['all']")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "ФОП 2 група звітність",
                "sources": ["tax.gov.ua", "zakon.rada.gov.ua"]
            }
        }


class SearchResponse(BaseModel):
    """Ответ с результатами поиска"""
    query: str
    sources: List[str]
    results: List[SearchResult]
    total_results: int
    cached: bool = False
    
    class Config:
        from_attributes = True

