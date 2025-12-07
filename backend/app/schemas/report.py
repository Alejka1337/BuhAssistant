"""
Pydantic схемы для жалоб и блокировок
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ContentReportCreate(BaseModel):
    """Схема для создания жалобы"""
    content_type: str = Field(..., description="Тип контента: 'thread' или 'post'")
    content_id: int = Field(..., description="ID топика или комментария")
    reported_user_id: int = Field(..., description="ID пользователя-нарушителя")
    reason: str = Field(..., description="Причина: 'spam', 'abuse', 'inappropriate', 'other'")
    details: Optional[str] = Field(None, description="Дополнительная информация")


class ContentReportResponse(BaseModel):
    """Схема для ответа с жалобой"""
    id: int
    reporter_id: int
    reported_user_id: int
    content_type: str
    content_id: int
    reason: str
    details: Optional[str]
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by_id: Optional[int]
    
    class Config:
        from_attributes = True


class UserBlockCreate(BaseModel):
    """Схема для создания блокировки"""
    blocked_id: int = Field(..., description="ID пользователя для блокировки")


class BlockedUserInfo(BaseModel):
    """Информация о заблокированном пользователе"""
    email: str
    full_name: Optional[str]
    
    class Config:
        from_attributes = True


class UserBlockResponse(BaseModel):
    """Схема для ответа с блокировкой"""
    id: int
    blocker_id: int
    blocked_id: int
    created_at: datetime
    blocked_user: Optional[BlockedUserInfo] = None
    
    class Config:
        from_attributes = True

