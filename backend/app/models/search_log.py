"""
Модель для логирования поисковых запросов
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Информация о запросе
    query = Column(String, nullable=False, index=True)
    sources = Column(JSON, default=[])  # Список выбранных источников
    
    # Результаты
    results_count = Column(Integer, default=0)
    
    # Пользователь (опционально, пока NULL)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Метаданные
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Время
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<SearchLog(id={self.id}, query={self.query})>"

