"""
Схемы для push-уведомлений
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class PushTokenRegister(BaseModel):
    """Регистрация push токена"""
    push_token: str = Field(..., description="Expo push token")


class NotificationSettingsUpdate(BaseModel):
    """Обновление настроек уведомлений"""
    enable_deadline_notifications: Optional[bool] = None
    enable_news_notifications: Optional[bool] = None
    deadline_days_before: Optional[List[int]] = Field(None, description="За сколько дней уведомлять о дедлайнах")


class NotificationSettingsResponse(BaseModel):
    """Ответ с настройками уведомлений"""
    user_id: int
    enable_deadline_notifications: bool
    enable_news_notifications: bool
    deadline_days_before: List[int]
    
    class Config:
        from_attributes = True


class TestNotificationRequest(BaseModel):
    """Запрос на отправку тестового уведомления"""
    title: str = Field(..., description="Заголовок уведомления")
    body: str = Field(..., description="Текст уведомления")
    data: Optional[dict] = Field(None, description="Дополнительные данные")


class NotificationResponse(BaseModel):
    """Ответ после отправки уведомления"""
    success: bool
    message: str
    details: Optional[dict] = None

