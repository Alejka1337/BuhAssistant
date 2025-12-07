"""
Pydantic схемы для анонимных push токенов
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AnonymousPushTokenCreate(BaseModel):
    """Схема для создания анонимного push токена"""
    token: str
    platform: str  # ios, android, web
    device_id: Optional[str] = None


class AnonymousPushTokenResponse(BaseModel):
    """Схема ответа с информацией об анонимном токене"""
    id: int
    token: str
    platform: str
    device_id: Optional[str]
    created_at: datetime
    last_active_at: datetime
    is_linked_to_user: Optional[int]

    class Config:
        from_attributes = True


class LinkTokenToUserRequest(BaseModel):
    """Схема для привязки анонимного токена к пользователю"""
    anonymous_token: str

