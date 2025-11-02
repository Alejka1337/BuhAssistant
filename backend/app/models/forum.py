"""
Модели форума
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ForumCategory(Base):
    __tablename__ = "forum_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    order = Column(Integer, default=0)
    
    # Relationships
    threads = relationship("ForumThread", back_populates="category")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ForumCategory(id={self.id}, name={self.name})>"


class ForumThread(Base):
    __tablename__ = "forum_threads"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("forum_categories.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    
    # Статус
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    is_solved = Column(Boolean, default=False)
    
    # Счетчики
    views_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    
    # Relationships
    category = relationship("ForumCategory", back_populates="threads")
    posts = relationship("ForumPost", back_populates="thread", cascade="all, delete-orphan")
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_post_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<ForumThread(id={self.id}, title={self.title[:50]})>"


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("forum_threads.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=True)  # Для вложенных комментариев
    
    content = Column(Text, nullable=False)
    
    # Статус
    is_best_answer = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    # Счетчики
    likes_count = Column(Integer, default=0)
    
    # Relationships
    thread = relationship("ForumThread", back_populates="posts")
    parent = relationship("ForumPost", remote_side=[id], backref="replies")
    likes = relationship("ForumLike", back_populates="post", cascade="all, delete-orphan")
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<ForumPost(id={self.id}, thread_id={self.thread_id})>"


class ForumLike(Base):
    __tablename__ = "forum_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    post = relationship("ForumPost", back_populates="likes")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ForumLike(post_id={self.post_id}, user_id={self.user_id})>"

