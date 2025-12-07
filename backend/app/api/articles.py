"""
API для работы со статьями
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import Optional
from datetime import datetime
import re
import logging

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.article import Article
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleListItem,
    ArticleListResponse,
)
from app.api.deps import get_current_user, get_current_user_optional as get_optional_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/articles", tags=["articles"])


def generate_slug(title: str) -> str:
    """
    Генерация slug из заголовка
    """
    # Транслитерация украинского в латиницу
    translit_map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
        'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
        'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu',
        'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye',
        'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L',
        'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu',
        'Я': 'Ya',
    }
    
    # Транслитерация
    slug = ''
    for char in title:
        slug += translit_map.get(char, char)
    
    # Приводим к lowercase и заменяем пробелы на дефисы
    slug = slug.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = slug.strip('-')
    
    return slug[:100]  # Ограничиваем длину


@router.get("", response_model=ArticleListResponse)
def get_articles(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    published_only: bool = True,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Получить список статей с пагинацией и поиском
    
    - page: номер страницы
    - per_page: количество статей на странице
    - search: поиск по заголовку
    - published_only: показывать только опубликованные (для гостей всегда True)
    """
    # Базовый запрос
    query = db.query(Article).options(joinedload(Article.author))
    
    # Фильтр по статусу публикации
    if published_only or not current_user or current_user.role == UserRole.USER:
        query = query.filter(Article.is_published == True)
    
    # Поиск
    if search:
        query = query.filter(Article.title.ilike(f'%{search}%'))
    
    # Сортировка (сначала новые)
    query = query.order_by(desc(Article.published_at), desc(Article.created_at))
    
    # Подсчет общего количества
    total = query.count()
    
    # Пагинация
    offset = (page - 1) * per_page
    articles = query.offset(offset).limit(per_page).all()
    
    # Формирование ответа
    total_pages = (total + per_page - 1) // per_page
    
    return {
        'articles': articles,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
    }


@router.get("/{slug}", response_model=ArticleResponse)
def get_article(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Получить статью по slug
    """
    article = db.query(Article).options(
        joinedload(Article.author)
    ).filter(Article.slug == slug).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Стаття не знайдена")
    
    # Проверка доступа к неопубликованным статьям
    if not article.is_published:
        if not current_user or current_user.role == UserRole.USER:
            raise HTTPException(status_code=404, detail="Стаття не знайдена")
    
    # Увеличиваем счетчик просмотров
    article.views += 1
    db.commit()
    
    return article


@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
def create_article(
    article_data: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать новую статью (только для модераторов и админов)
    """
    # Проверка прав доступа
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Тільки модератори та адміністратори можуть створювати статті"
        )
    
    # Генерация slug
    base_slug = generate_slug(article_data.title)
    slug = base_slug
    counter = 1
    
    # Проверка уникальности slug
    while db.query(Article).filter(Article.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Создание статьи
    new_article = Article(
        title=article_data.title,
        slug=slug,
        content=article_data.content,
        excerpt=article_data.excerpt,
        meta_title=article_data.meta_title,
        meta_description=article_data.meta_description,
        cover_image=article_data.cover_image,
        is_published=article_data.is_published,
        author_id=current_user.id,
        published_at=datetime.utcnow() if article_data.is_published else None,
    )
    
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    
    # Загружаем связи
    new_article = db.query(Article).options(
        joinedload(Article.author)
    ).filter(Article.id == new_article.id).first()
    
    logger.info(f"✅ Article created: {new_article.slug} by user_id={current_user.id}")
    
    return new_article


@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить статью (только автор, модераторы и админы)
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Стаття не знайдена")
    
    # Проверка прав доступа
    if current_user.role == UserRole.USER or (
        current_user.role == UserRole.MODERATOR and article.author_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Ви можете редагувати тільки свої статті"
        )
    
    # Обновление полей
    if article_data.title is not None:
        article.title = article_data.title
        # Обновляем slug при изменении заголовка
        base_slug = generate_slug(article_data.title)
        slug = base_slug
        counter = 1
        while db.query(Article).filter(Article.slug == slug, Article.id != article_id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        article.slug = slug
    
    if article_data.content is not None:
        article.content = article_data.content
    
    if article_data.excerpt is not None:
        article.excerpt = article_data.excerpt
    
    if article_data.meta_title is not None:
        article.meta_title = article_data.meta_title
    
    if article_data.meta_description is not None:
        article.meta_description = article_data.meta_description
    
    if article_data.cover_image is not None:
        article.cover_image = article_data.cover_image
    
    if article_data.is_published is not None:
        # Если публикуем впервые - устанавливаем дату публикации
        if article_data.is_published and not article.is_published:
            article.published_at = datetime.utcnow()
        article.is_published = article_data.is_published
    
    db.commit()
    db.refresh(article)
    
    # Загружаем связи
    article = db.query(Article).options(
        joinedload(Article.author)
    ).filter(Article.id == article.id).first()
    
    logger.info(f"✅ Article updated: {article.slug} by user_id={current_user.id}")
    
    return article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить статью (только админы)
    """
    # Проверка прав доступа
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Тільки адміністратори можуть видаляти статті"
        )
    
    article = db.query(Article).filter(Article.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Стаття не знайдена")
    
    logger.info(f"🗑️ Article deleted: {article.slug} by user_id={current_user.id}")
    
    db.delete(article)
    db.commit()

