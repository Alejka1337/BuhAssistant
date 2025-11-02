"""
Модели базы данных
"""
from app.models.user import User
from app.models.news import News
from app.models.forum import ForumCategory, ForumThread, ForumPost, ForumLike
from app.models.search_log import SearchLog

__all__ = [
    "User",
    "News",
    "ForumCategory",
    "ForumThread",
    "ForumPost",
    "ForumLike",
    "SearchLog",
]

