"""
Модель для логирования AI-модерации контента
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class ContentType(str, enum.Enum):
    """Тип контента для модерации"""
    THREAD = "thread"
    POST = "post"


class ModerationDecision(str, enum.Enum):
    """Решение модерации"""
    APPROVED = "approved"
    REJECTED = "rejected"


class ModerationLog(Base):
    """
    Лог AI-модерации контента форума
    
    Хранит результаты проверки контента через OpenAI Moderation API
    """
    __tablename__ = "moderation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Тип контента и его ID
    content_type = Column(SQLEnum(ContentType), nullable=False)
    content_id = Column(Integer, nullable=True)  # Может быть NULL если контент отклонен
    
    # Автор контента
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Решение модерации
    decision = Column(SQLEnum(ModerationDecision), nullable=False, index=True)
    
    # Причина отклонения (если отклонено)
    reason = Column(Text, nullable=True)
    
    # Полный ответ от OpenAI API (JSON)
    ai_response = Column(JSON, nullable=True)
    
    # Текст контента (для анализа)
    content_text = Column(Text, nullable=False)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<ModerationLog(id={self.id}, type={self.content_type}, decision={self.decision})>"

