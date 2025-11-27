"""
Модели для форума BuhAssistant
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ForumCategory(Base):
    """Категория форума"""
    __tablename__ = "forum_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    icon = Column(String(50), nullable=True)  # Название иконки MaterialIcons
    order = Column(Integer, default=0)  # Порядок отображения
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    threads = relationship("ForumThread", back_populates="category", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ForumCategory(id={self.id}, name='{self.name}')>"


class ForumThread(Base):
    """Топик форума"""
    __tablename__ = "forum_threads"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("forum_categories.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    views = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)  # Закреплен ли топик
    is_closed = Column(Boolean, default=False)  # Закрыт ли для комментариев
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    category = relationship("ForumCategory", back_populates="threads")
    user = relationship("User", back_populates="forum_threads")
    posts = relationship("ForumPost", back_populates="thread", cascade="all, delete-orphan")
    
    # Индексы для оптимизации запросов
    __table_args__ = (
        Index('ix_forum_threads_category_created', 'category_id', 'created_at'),
        Index('ix_forum_threads_user', 'user_id'),
    )
    
    def __repr__(self):
        return f"<ForumThread(id={self.id}, title='{self.title}')>"


class ForumPost(Base):
    """Комментарий/ответ в топике"""
    __tablename__ = "forum_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("forum_threads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=True)  # Для вложенных ответов
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True)  # Время последнего редактирования
    
    # Relationships
    thread = relationship("ForumThread", back_populates="posts")
    user = relationship("User", back_populates="forum_posts")
    parent = relationship("ForumPost", remote_side=[id], backref="replies")
    likes = relationship("ForumLike", back_populates="post", cascade="all, delete-orphan")
    
    # Индексы для оптимизации запросов
    __table_args__ = (
        Index('ix_forum_posts_thread_created', 'thread_id', 'created_at'),
        Index('ix_forum_posts_user', 'user_id'),
        Index('ix_forum_posts_parent', 'parent_id'),
    )
    
    def __repr__(self):
        return f"<ForumPost(id={self.id}, thread_id={self.thread_id})>"


class ForumLike(Base):
    """Лайк на комментарий"""
    __tablename__ = "forum_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("ForumPost", back_populates="likes")
    user = relationship("User", back_populates="forum_likes")
    
    # Индексы и ограничения
    __table_args__ = (
        Index('ix_forum_likes_post_user', 'post_id', 'user_id', unique=True),  # Один пользователь - один лайк на пост
        Index('ix_forum_likes_user', 'user_id'),
    )
    
    def __repr__(self):
        return f"<ForumLike(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"
