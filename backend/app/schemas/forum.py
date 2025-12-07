"""
Pydantic схемы для форума
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ThreadSortType(str, Enum):
    """Тип сортировки топиков"""
    NEW = "new"  # Новые
    HOT = "hot"  # Горячие (больше комментариев/лайков)
    UNANSWERED = "unanswered"  # Без ответов


# ========== Category Schemas ==========

class ForumCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    icon: Optional[str] = Field(None, max_length=50)
    order: int = 0


class ForumCategoryResponse(ForumCategoryBase):
    id: int
    created_at: datetime
    threads_count: Optional[int] = 0  # Будем считать на бэкенде
    
    class Config:
        from_attributes = True


# ========== Thread Schemas ==========

class ForumThreadCreate(BaseModel):
    category_id: int
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10)


class ForumThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=10)


class ForumThreadAuthor(BaseModel):
    """Информация об авторе"""
    id: int
    full_name: Optional[str]
    email: str
    
    class Config:
        from_attributes = True


class ForumThreadResponse(BaseModel):
    id: int
    category_id: int
    user_id: int
    title: str
    content: str
    views: int
    is_pinned: bool
    is_closed: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Дополнительные данные
    author: Optional[ForumThreadAuthor] = None
    category_name: Optional[str] = None
    posts_count: Optional[int] = 0
    likes_count: Optional[int] = 0
    posts: List['ForumPostResponse'] = []  # Список комментариев с вложенностью
    
    class Config:
        from_attributes = True


class ForumThreadListItem(BaseModel):
    """Упрощенная версия для списка"""
    id: int
    category_id: int
    title: str
    views: int
    is_pinned: bool
    is_closed: bool
    created_at: datetime
    
    # Дополнительные данные
    author: Optional[ForumThreadAuthor] = None
    posts_count: Optional[int] = 0
    last_post_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ForumThreadListResponse(BaseModel):
    """Ответ со списком топиков"""
    items: List[ForumThreadListItem]
    total: int
    limit: int
    offset: int


# ========== Post Schemas ==========

class ForumPostCreate(BaseModel):
    thread_id: int
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None  # Для вложенных ответов


class ForumPostUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class ForumPostAuthor(BaseModel):
    """Информация об авторе комментария"""
    id: int
    full_name: Optional[str]
    
    class Config:
        from_attributes = True


class ForumPostResponse(BaseModel):
    id: int
    thread_id: int
    user_id: int
    parent_id: Optional[int]
    content: str
    created_at: datetime
    updated_at: Optional[datetime]
    edited_at: Optional[datetime]
    
    # Дополнительные данные
    author: Optional[ForumPostAuthor] = None
    likes_count: Optional[int] = 0
    is_liked_by_user: Optional[bool] = False  # Лайкнул ли текущий пользователь
    replies: Optional[List['ForumPostResponse']] = []  # Вложенные ответы
    
    class Config:
        from_attributes = True


# Обновляем модели для поддержки forward references
ForumPostResponse.model_rebuild()
ForumThreadResponse.model_rebuild()


# ========== Like Schemas ==========

class ForumLikeCreate(BaseModel):
    post_id: int


class ForumLikeResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ForumLikeToggleResponse(BaseModel):
    """Ответ при toggle лайка"""
    liked: bool  # True если лайк добавлен, False если удален
    likes_count: int  # Новое количество лайков


# ========== Search Schemas ==========

class ForumSearchResult(BaseModel):
    """Результат поиска"""
    type: str  # "thread" или "post"
    id: int
    title: Optional[str]  # Для thread
    content: str
    thread_id: Optional[int]  # Для post
    created_at: datetime
    author: Optional[ForumPostAuthor]


class ForumSearchResponse(BaseModel):
    """Ответ поиска"""
    items: List[ForumSearchResult]
    total: int

