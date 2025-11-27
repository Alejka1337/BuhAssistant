"""
Модель настроек уведомлений
"""
from sqlalchemy import Column, Integer, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class NotificationSettings(Base):
    """Настройки push-уведомлений пользователя"""
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Включить/выключить типы уведомлений
    enable_deadline_notifications = Column(Boolean, default=True)
    enable_news_notifications = Column(Boolean, default=True)
    
    # Настройки дедлайнов (за сколько дней уведомлять)
    deadline_days_before = Column(JSON, default=[1, 3])  # За 1 и 3 дня
    
    # Дополнительные настройки (для будущих расширений)
    extra_settings = Column(JSON, default={})
    
    # Связь с пользователем
    user = relationship("User", back_populates="notification_settings")

    def __repr__(self):
        return f"<NotificationSettings(user_id={self.user_id})>"

