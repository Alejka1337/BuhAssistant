"""
Модель новостей
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class NewsCategory(str, enum.Enum):
    FOP_1 = "fop_1"
    FOP_2 = "fop_2"
    FOP_3 = "fop_3"
    LEGAL_ENTITY = "legal_entity"
    PDV = "pdv"
    ESV = "esv"
    SALARY = "salary"
    TAX_LAW = "tax_law"
    GENERAL = "general"


class NewsPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)  # Краткое описание
    url = Column(String, nullable=False, unique=True)  # URL источника
    source = Column(String, nullable=False, index=True)  # Домен источника
    
    # Категоризация (через OpenAI)
    categories = Column(JSON, default=[])  # Список категорий [NewsCategory]
    tags = Column(JSON, default=[])  # Дополнительные теги
    target_audience = Column(JSON, default=[])  # Целевая аудитория
    priority = Column(SQLEnum(NewsPriority), default=NewsPriority.NORMAL)
    
    # Дата публикации (с исходного сайта)
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Статус
    is_published = Column(Boolean, default=True)
    is_push_sent = Column(Boolean, default=False)  # Отправлен ли push
    
    # Метаданные
    author = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<News(id={self.id}, title={self.title[:50]})>"

