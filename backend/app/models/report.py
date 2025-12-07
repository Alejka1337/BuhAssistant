"""
Модели для жалоб и блокировок пользователей
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ContentReport(Base):
    """Жалоба на контент (топик или комментарий)"""
    __tablename__ = "content_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_type = Column(String(20), nullable=False)  # "thread" или "post"
    content_id = Column(Integer, nullable=False)  # ID топика или поста
    reason = Column(String(50), nullable=False)  # "spam", "abuse", "inappropriate", "other"
    details = Column(Text, nullable=True)  # Дополнительная информация
    status = Column(String(20), default="pending", nullable=False)  # "pending", "reviewed", "dismissed"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    
    # Индексы для оптимизации
    __table_args__ = (
        Index('ix_content_reports_status', 'status'),
        Index('ix_content_reports_content', 'content_type', 'content_id'),
    )
    
    def __repr__(self):
        return f"<ContentReport(id={self.id}, content_type={self.content_type}, status={self.status})>"


class UserBlock(Base):
    """Блокировка пользователя другим пользователем"""
    __tablename__ = "user_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])
    
    # Unique constraint: один пользователь не может заблокировать другого дважды
    __table_args__ = (
        UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocker_blocked'),
        Index('ix_user_blocks_blocker', 'blocker_id'),
    )
    
    def __repr__(self):
        return f"<UserBlock(blocker_id={self.blocker_id}, blocked_id={self.blocked_id})>"

