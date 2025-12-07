"""
Модель для статей от авторов
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Article(Base):
    """
    Статьи от модераторов и администраторов
    
    Статьи отображаются только на веб-версии приложения
    """
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Заголовок и slug для URL
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    
    # Контент (HTML) и краткое описание
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)  # Краткое описание для списка
    
    # SEO мета-теги
    meta_title = Column(String(255), nullable=True)  # SEO title (если не указан, используется title)
    meta_description = Column(Text, nullable=True)  # SEO description
    
    # Обложка статьи
    cover_image = Column(String(500), nullable=True)
    
    # Автор статьи
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    author = relationship("User", backref="articles")
    
    # Статус публикации
    is_published = Column(Boolean, default=False, index=True)
    
    # Счетчик просмотров
    views = Column(Integer, default=0)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    def __repr__(self):
        return f"<Article(id={self.id}, title='{self.title}', slug='{self.slug}')>"

