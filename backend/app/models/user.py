"""
Модель пользователя
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class UserType(str, enum.Enum):
    FOP = "fop"
    LEGAL_ENTITY = "legal_entity"
    ACCOUNTANT = "accountant"
    INDIVIDUAL = "individual"


class FOPGroup(str, enum.Enum):
    GROUP_1 = "1"
    GROUP_2 = "2"
    GROUP_3 = "3"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable для Google OAuth
    full_name = Column(String, nullable=True)
    
    # Тип пользователя и настройки
    user_type = Column(SQLEnum(UserType), nullable=True)
    fop_group = Column(SQLEnum(FOPGroup), nullable=True)
    tax_system = Column(String, nullable=True)  # Для юрособ
    
    # OAuth
    google_id = Column(String, unique=True, nullable=True, index=True)
    
    # Push notifications
    push_token = Column(String, nullable=True)
    notification_preferences = Column(JSON, default={})
    
    # Статус
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    
    # Email активация
    activation_code = Column(String, nullable=True, index=True)
    activation_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Сброс пароля
    reset_password_code = Column(String, nullable=True, index=True)
    reset_password_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Связи
    notification_settings = relationship("NotificationSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    forum_threads = relationship("ForumThread", back_populates="user", cascade="all, delete-orphan")
    forum_posts = relationship("ForumPost", back_populates="user", cascade="all, delete-orphan")
    forum_likes = relationship("ForumLike", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

