"""
Модель для анонимных push токенов
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class AnonymousPushToken(Base):
    """
    Анонимные push токены для незарегистрированных пользователей.
    Позволяет отправлять push-уведомления о новостях до регистрации.
    """
    __tablename__ = "anonymous_push_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    platform = Column(String, nullable=False)  # ios, android, web
    device_id = Column(String, nullable=True, index=True)  # Опционально для tracking
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_active_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Опционально: флаг для пометки связанных с user токенов
    is_linked_to_user = Column(Integer, nullable=True)  # user_id после привязки

    def __repr__(self):
        return f"<AnonymousPushToken(id={self.id}, platform={self.platform}, token={self.token[:20]}...)>"

