"""
Pydantic схемы для AI-модерации
"""
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from app.models.moderation import ContentType, ModerationDecision


class ModerationResultSchema(BaseModel):
    """Результат модерации контента"""
    approved: bool
    reason: Optional[str] = None
    categories: Optional[Dict] = None
    

class ModerationLogCreate(BaseModel):
    """Создание лога модерации"""
    content_type: ContentType
    content_id: Optional[int] = None
    user_id: int
    decision: ModerationDecision
    reason: Optional[str] = None
    ai_response: Optional[Dict] = None
    content_text: str


class ModerationLogResponse(BaseModel):
    """Ответ с логом модерации"""
    id: int
    content_type: ContentType
    content_id: Optional[int]
    user_id: int
    decision: ModerationDecision
    reason: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModerationError(BaseModel):
    """Ошибка модерации для фронтенда"""
    detail: str
    reason: str
    suggestions: list[str]
    
    @classmethod
    def from_reason(cls, reason: str):
        """Создает ошибку с рекомендациями на основе причины"""
        suggestions = [
            "Переформулюйте ваше повідомлення більш коректно",
            "Уникайте образливих висловів та нецензурної лексики",
            "Пишіть конструктивно та дотримуйтесь правил спільноти",
        ]
        
        # Добавляем специфические рекомендации в зависимости от причины
        if "сексуальний" in reason.lower() or "sexual" in reason.lower():
            suggestions.insert(0, "Уникайте сексуально-орієнтованого контенту")
        elif "ненависті" in reason.lower() or "hate" in reason.lower():
            suggestions.insert(0, "Поважайте всіх учасників спільноти незалежно від їхніх поглядів")
        elif "домагання" in reason.lower() or "harassment" in reason.lower():
            suggestions.insert(0, "Не допускайте домагань або погроз на адресу інших користувачів")
        elif "насильство" in reason.lower() or "violence" in reason.lower():
            suggestions.insert(0, "Уникайте контенту, що пропагує насильство")
        elif "незаконна" in reason.lower() or "illicit" in reason.lower():
            suggestions.insert(0, "Не публікуйте контент, що стосується незаконної діяльності")
        
        return cls(
            detail="Ваш контент не пройшов автоматичну модерацію",
            reason=reason,
            suggestions=suggestions[:4]  # Максимум 4 рекомендации
        )

