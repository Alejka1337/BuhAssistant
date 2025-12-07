"""
Pydantic схемы для статей
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re


class ArticleBase(BaseModel):
    """Базовая схема статьи"""
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=50)
    excerpt: Optional[str] = Field(None, max_length=500)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = None
    is_published: bool = False


class ArticleCreate(ArticleBase):
    """Создание статьи"""
    
    @validator('title')
    def generate_slug(cls, v):
        """Валидация заголовка (slug будет сгенерирован на backend)"""
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()


class ArticleUpdate(BaseModel):
    """Обновление статьи"""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=50)
    excerpt: Optional[str] = Field(None, max_length=500)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None


class ArticleAuthor(BaseModel):
    """Автор статьи"""
    id: int
    full_name: str
    email: str
    
    class Config:
        from_attributes = True


class ArticleResponse(ArticleBase):
    """Ответ с полной информацией о статье"""
    id: int
    slug: str
    author_id: int
    author: ArticleAuthor
    views: int
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ArticleListItem(BaseModel):
    """Элемент списка статей (краткая информация)"""
    id: int
    title: str
    slug: str
    excerpt: Optional[str]
    cover_image: Optional[str]
    author: ArticleAuthor
    views: int
    created_at: datetime
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    """Ответ со списком статей и пагинацией"""
    articles: list[ArticleListItem]
    total: int
    page: int
    per_page: int
    total_pages: int

