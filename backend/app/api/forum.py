"""
API для форума
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_
from typing import List, Optional
from datetime import datetime
import logging

from app.db.database import get_db
from app.models.user import User
from app.models.forum import ForumCategory, ForumThread, ForumPost, ForumLike
from app.models.report import UserBlock
from app.models.moderation import ModerationLog, ContentType, ModerationDecision
from app.services.moderation_service import check_forum_content
from app.schemas.moderation import ModerationError

logger = logging.getLogger(__name__)
from app.schemas.forum import (
    ForumCategoryResponse,
    ForumThreadCreate,
    ForumThreadUpdate,
    ForumThreadResponse,
    ForumThreadListItem,
    ForumThreadListResponse,
    ForumPostCreate,
    ForumPostUpdate,
    ForumPostResponse,
    ForumLikeToggleResponse,
    ForumThreadAuthor,
    ForumPostAuthor,
    ThreadSortType,
)
from app.api.deps import get_current_user, get_current_user_optional
from app.core.deps import get_current_moderator

router = APIRouter(prefix="/api/forum", tags=["forum"])


# ========== Вспомогательные функции ==========

def get_blocked_user_ids(current_user_id: Optional[int], db: Session) -> List[int]:
    """Получить список ID заблокированных пользователей"""
    if not current_user_id:
        return []
    
    blocked_ids = db.query(UserBlock.blocked_id).filter(
        UserBlock.blocker_id == current_user_id
    ).all()
    
    return [blocked_id[0] for blocked_id in blocked_ids]


def build_post_tree(posts: List[ForumPost], parent_id: Optional[int], current_user_id: Optional[int], db: Session) -> List[dict]:
    """Рекурсивно строим дерево комментариев"""
    result = []
    
    for post in posts:
        if post.parent_id == parent_id:
            # Получаем количество лайков
            likes_count = len(post.likes)
            
            # Проверяем, лайкнул ли текущий пользователь
            is_liked = False
            if current_user_id:
                is_liked = any(like.user_id == current_user_id for like in post.likes)
            
            # Рекурсивно получаем дочерние комментарии
            replies = build_post_tree(posts, post.id, current_user_id, db)
            
            post_dict = {
                "id": post.id,
                "thread_id": post.thread_id,
                "user_id": post.user_id,
                "parent_id": post.parent_id,
                "content": post.content,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "edited_at": post.edited_at,
                "author": {
                    "id": post.user.id,
                    "full_name": post.user.full_name,
                } if post.user else None,
                "likes_count": likes_count,
                "is_liked": is_liked,
                "replies": replies,
            }
            result.append(post_dict)
    
    return result


# ========== Categories Endpoints ==========

@router.get("/categories", response_model=List[ForumCategoryResponse])
def get_categories(
    db: Session = Depends(get_db)
):
    """
    Получить список всех категорий форума
    """
    categories = db.query(ForumCategory).order_by(ForumCategory.order, ForumCategory.name).all()
    
    # Добавляем количество топиков для каждой категории
    result = []
    for category in categories:
        threads_count = db.query(func.count(ForumThread.id)).filter(ForumThread.category_id == category.id).scalar() or 0
        category_dict = category.__dict__.copy()
        category_dict["threads_count"] = threads_count
        result.append(category_dict)
    
    return result


# ========== Threads Endpoints ==========

@router.get("/threads", response_model=ForumThreadListResponse)
def get_threads(
    category_id: Optional[int] = Query(None, description="Фильтр по категории"),
    sort: ThreadSortType = Query(ThreadSortType.NEW, description="Тип сортировки"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Получить список топиков с фильтрацией и сортировкой
    """
    query = db.query(ForumThread).options(
        joinedload(ForumThread.user),
        joinedload(ForumThread.category)
    )
    
    # Фильтр по категории
    if category_id:
        query = query.filter(ForumThread.category_id == category_id)
    
    # Сортировка
    if sort == ThreadSortType.NEW:
        query = query.order_by(desc(ForumThread.is_pinned), desc(ForumThread.created_at))
    elif sort == ThreadSortType.HOT:
        # Горячие - много комментариев за последнее время
        posts_count_subquery = (
            db.query(
                ForumPost.thread_id,
                func.count(ForumPost.id).label("posts_count")
            )
            .group_by(ForumPost.thread_id)
            .subquery()
        )
        query = (
            query
            .outerjoin(posts_count_subquery, ForumThread.id == posts_count_subquery.c.thread_id)
            .order_by(desc(ForumThread.is_pinned), desc(posts_count_subquery.c.posts_count))
        )
    elif sort == ThreadSortType.UNANSWERED:
        # Топики без ответов
        posts_count_subquery = (
            db.query(
                ForumPost.thread_id,
                func.count(ForumPost.id).label("posts_count")
            )
            .group_by(ForumPost.thread_id)
            .subquery()
        )
        query = (
            query
            .outerjoin(posts_count_subquery, ForumThread.id == posts_count_subquery.c.thread_id)
            .filter(or_(posts_count_subquery.c.posts_count == None, posts_count_subquery.c.posts_count == 0))
            .order_by(desc(ForumThread.created_at))
        )
    
    # Подсчет общего количества
    total = query.count()
    
    # Pagination
    threads = query.offset(offset).limit(limit).all()
    
    # Формируем ответ с дополнительными данными
    items = []
    for thread in threads:
        posts_count = db.query(func.count(ForumPost.id)).filter(ForumPost.thread_id == thread.id).scalar() or 0
        last_post = db.query(ForumPost).filter(ForumPost.thread_id == thread.id).order_by(desc(ForumPost.created_at)).first()
        
        item = {
            "id": thread.id,
            "category_id": thread.category_id,
            "title": thread.title,
            "views": thread.views,
            "is_pinned": thread.is_pinned,
            "is_closed": thread.is_closed,
            "created_at": thread.created_at,
            "author": {
                "id": thread.user.id,
                "full_name": thread.user.full_name,
                "email": thread.user.email,
            } if thread.user else None,
            "posts_count": posts_count,
            "last_post_at": last_post.created_at if last_post else None,
        }
        items.append(item)
    
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/threads/{thread_id}", response_model=ForumThreadResponse)
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Получить детали топика со всеми комментариями (древовидная структура)
    """
    thread = db.query(ForumThread).options(
        joinedload(ForumThread.user),
        joinedload(ForumThread.category)
    ).filter(ForumThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Топик не найден")
    
    # Увеличиваем счетчик просмотров
    thread.views += 1
    db.commit()
    
    # Получаем все комментарии с автором и лайками
    posts = db.query(ForumPost).options(
        joinedload(ForumPost.user),
        joinedload(ForumPost.likes)
    ).filter(ForumPost.thread_id == thread_id).order_by(ForumPost.created_at).all()
    
    # Строим дерево комментариев
    current_user_id = current_user.id if current_user else None
    posts_tree = build_post_tree(posts, None, current_user_id, db)
    
    # Подсчет лайков для всего топика
    total_likes = db.query(func.count(ForumLike.id)).join(ForumPost).filter(ForumPost.thread_id == thread_id).scalar() or 0
    
    return {
        "id": thread.id,
        "category_id": thread.category_id,
        "user_id": thread.user_id,
        "title": thread.title,
        "content": thread.content,
        "views": thread.views,
        "is_pinned": thread.is_pinned,
        "is_closed": thread.is_closed,
        "created_at": thread.created_at,
        "updated_at": thread.updated_at or thread.created_at,  # Fallback на created_at если None
        "author": {
            "id": thread.user.id,
            "full_name": thread.user.full_name,
            "email": thread.user.email,
        } if thread.user else None,
        "category_name": thread.category.name if thread.category else None,
        "posts_count": len(posts),
        "likes_count": total_likes,
        "posts": posts_tree,
    }


@router.post("/threads", response_model=ForumThreadResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(
    thread_data: ForumThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать новый топик с AI-модерацией (требуется авторизация)
    """
    # 1. AI-модерация контента перед созданием
    logger.info(f"🤖 Moderating thread from user_id={current_user.id}")
    moderation_result = await check_forum_content(
        title=thread_data.title,
        content=thread_data.content
    )
    
    # Логируем результат модерации
    moderation_log = ModerationLog(
        content_type=ContentType.THREAD,
        content_id=None,  # Пока не создан
        user_id=current_user.id,
        decision=ModerationDecision.APPROVED if moderation_result.approved else ModerationDecision.REJECTED,
        reason=moderation_result.reason,
        ai_response=moderation_result.raw_response,
        content_text=f"{thread_data.title}\n\n{thread_data.content or ''}"
    )
    db.add(moderation_log)
    db.commit()
    
    # Если контент не прошел модерацию - возвращаем ошибку
    if not moderation_result.approved:
        logger.warning(f"⛔ Thread rejected for user_id={current_user.id}: {moderation_result.reason}")
        error = ModerationError.from_reason(moderation_result.reason or "Контент порушує правила")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error.dict()
        )
    
    logger.info(f"✅ Thread approved for user_id={current_user.id}")
    
    # 2. Проверяем существование категории
    category = db.query(ForumCategory).filter(ForumCategory.id == thread_data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    
    # 3. Создаем топик
    new_thread = ForumThread(
        category_id=thread_data.category_id,
        user_id=current_user.id,
        title=thread_data.title,
        content=thread_data.content,
    )
    
    db.add(new_thread)
    db.commit()
    db.refresh(new_thread)
    
    # 4. Обновляем moderation_log с content_id
    moderation_log.content_id = new_thread.id
    db.commit()
    
    # Загружаем связи
    new_thread = db.query(ForumThread).options(
        joinedload(ForumThread.user),
        joinedload(ForumThread.category)
    ).filter(ForumThread.id == new_thread.id).first()
    
    return {
        "id": new_thread.id,
        "category_id": new_thread.category_id,
        "user_id": new_thread.user_id,
        "title": new_thread.title,
        "content": new_thread.content,
        "views": new_thread.views,
        "is_pinned": new_thread.is_pinned,
        "is_closed": new_thread.is_closed,
        "created_at": new_thread.created_at,
        "updated_at": new_thread.updated_at or new_thread.created_at,  # Fallback на created_at если None
        "author": {
            "id": new_thread.user.id,
            "full_name": new_thread.user.full_name,
            "email": new_thread.user.email,
        },
        "category_name": new_thread.category.name,
        "posts_count": 0,
        "likes_count": 0,
    }


@router.put("/threads/{thread_id}", response_model=ForumThreadResponse)
def update_thread(
    thread_id: int,
    thread_data: ForumThreadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Редактировать свой топик (требуется авторизация)
    """
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Топик не найден")
    
    # Проверяем, что пользователь - автор
    if thread.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы можете редактировать только свои топики")
    
    # Обновляем поля
    if thread_data.title is not None:
        thread.title = thread_data.title
    if thread_data.content is not None:
        thread.content = thread_data.content
    
    thread.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(thread)
    
    # Загружаем связи
    thread = db.query(ForumThread).options(
        joinedload(ForumThread.user),
        joinedload(ForumThread.category)
    ).filter(ForumThread.id == thread_id).first()
    
    posts_count = db.query(func.count(ForumPost.id)).filter(ForumPost.thread_id == thread_id).scalar() or 0
    likes_count = db.query(func.count(ForumLike.id)).join(ForumPost).filter(ForumPost.thread_id == thread_id).scalar() or 0
    
    return {
        "id": thread.id,
        "category_id": thread.category_id,
        "user_id": thread.user_id,
        "title": thread.title,
        "content": thread.content,
        "views": thread.views,
        "is_pinned": thread.is_pinned,
        "is_closed": thread.is_closed,
        "created_at": thread.created_at,
        "updated_at": thread.updated_at,
        "author": {
            "id": thread.user.id,
            "full_name": thread.user.full_name,
            "email": thread.user.email,
        },
        "category_name": thread.category.name,
        "posts_count": posts_count,
        "likes_count": likes_count,
    }


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить свой топик (требуется авторизация)
    """
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Топик не найден")
    
    # Проверяем, что пользователь - автор
    if thread.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы можете удалять только свои топики")
    
    db.delete(thread)
    db.commit()


# ========== Posts Endpoints ==========

@router.post("/posts", response_model=ForumPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: ForumPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать комментарий/ответ с AI-модерацией (требуется авторизация)
    """
    # 1. AI-модерация контента перед созданием
    logger.info(f"🤖 Moderating post from user_id={current_user.id}")
    moderation_result = await check_forum_content(
        title="",  # У постов нет заголовка
        content=post_data.content
    )
    
    # Логируем результат модерации
    moderation_log = ModerationLog(
        content_type=ContentType.POST,
        content_id=None,  # Пока не создан
        user_id=current_user.id,
        decision=ModerationDecision.APPROVED if moderation_result.approved else ModerationDecision.REJECTED,
        reason=moderation_result.reason,
        ai_response=moderation_result.raw_response,
        content_text=post_data.content
    )
    db.add(moderation_log)
    db.commit()
    
    # Если контент не прошел модерацию - возвращаем ошибку
    if not moderation_result.approved:
        logger.warning(f"⛔ Post rejected for user_id={current_user.id}: {moderation_result.reason}")
        error = ModerationError.from_reason(moderation_result.reason or "Контент порушує правила")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error.dict()
        )
    
    logger.info(f"✅ Post approved for user_id={current_user.id}")
    
    # 2. Проверяем существование топика
    thread = db.query(ForumThread).filter(ForumThread.id == post_data.thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Топик не найден")
    
    # 3. Проверяем, не закрыт ли топик
    if thread.is_closed:
        raise HTTPException(status_code=403, detail="Топик закрыт для комментариев")
    
    # 4. Если это ответ на комментарий, проверяем существование родителя
    if post_data.parent_id:
        parent_post = db.query(ForumPost).filter(
            ForumPost.id == post_data.parent_id,
            ForumPost.thread_id == post_data.thread_id
        ).first()
        if not parent_post:
            raise HTTPException(status_code=404, detail="Родительский комментарий не найден")
    
    # 5. Создаем комментарий
    new_post = ForumPost(
        thread_id=post_data.thread_id,
        user_id=current_user.id,
        parent_id=post_data.parent_id,
        content=post_data.content,
    )
    
    db.add(new_post)
    
    # 6. Обновляем время последнего обновления топика
    thread.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_post)
    
    # 7. Обновляем moderation_log с content_id
    moderation_log.content_id = new_post.id
    db.commit()
    
    # Явно строим ответ
    return {
        "id": new_post.id,
        "thread_id": new_post.thread_id,
        "parent_id": new_post.parent_id,
        "content": new_post.content,
        "user_id": new_post.user_id,
        "created_at": new_post.created_at,
        "updated_at": new_post.updated_at or new_post.created_at,  # Fallback
        "edited_at": new_post.edited_at,
        "author": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
        },
        "likes_count": 0,
        "is_liked_by_user": False,
        "replies": [],
    }


@router.put("/posts/{post_id}", response_model=ForumPostResponse)
def update_post(
    post_id: int,
    post_data: ForumPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Редактировать свой комментарий (требуется авторизация)
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    
    # Проверяем, что пользователь - автор
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы можете редактировать только свои комментарии")
    
    # Обновляем контент
    post.content = post_data.content
    post.edited_at = datetime.utcnow()
    post.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(post)
    
    likes_count = len(post.likes) if post.likes else 0
    is_liked = any(like.user_id == current_user.id for like in post.likes) if post.likes else False
    
    # Явно строим ответ
    return {
        "id": post.id,
        "thread_id": post.thread_id,
        "parent_id": post.parent_id,
        "content": post.content,
        "user_id": post.user_id,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "edited_at": post.edited_at,
        "author": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
        },
        "likes_count": likes_count,
        "is_liked_by_user": is_liked,
        "replies": [],
    }


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить свой комментарий (требуется авторизация)
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    
    # Проверяем, что пользователь - автор
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы можете удалять только свои комментарии")
    
    db.delete(post)
    db.commit()


# ========== Likes Endpoints ==========

@router.post("/likes", response_model=ForumLikeToggleResponse)
def toggle_like(
    post_id: int = Query(..., description="ID комментария"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Лайкнуть/анлайкнуть комментарий (toggle) (требуется авторизация)
    """
    from sqlalchemy.exc import IntegrityError
    
    # Проверяем существование комментария
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    
    # Проверяем, есть ли уже лайк
    existing_like = db.query(ForumLike).filter(
        ForumLike.post_id == post_id,
        ForumLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Удаляем лайк
        db.delete(existing_like)
        db.commit()
        liked = False
    else:
        # Добавляем лайк
        new_like = ForumLike(
            post_id=post_id,
            user_id=current_user.id
        )
        db.add(new_like)
        
        try:
            db.commit()
            liked = True
        except IntegrityError:
            # Race condition: лайк уже был добавлен другим запросом
            db.rollback()
            # Перепроверяем состояние
            existing_like = db.query(ForumLike).filter(
                ForumLike.post_id == post_id,
                ForumLike.user_id == current_user.id
            ).first()
            liked = existing_like is not None
    
    # Подсчитываем текущее количество лайков
    likes_count = db.query(func.count(ForumLike.id)).filter(ForumLike.post_id == post_id).scalar() or 0
    
    return {
        "liked": liked,
        "likes_count": likes_count,
    }


# ========== Search Endpoint ==========

@router.get("/search")
def search_forum(
    q: str = Query(..., min_length=2, description="Поисковый запрос"),
    db: Session = Depends(get_db)
):
    """
    Поиск по топикам и комментариям
    Простой поиск через SQL LIKE (для полноценного поиска нужен Elasticsearch)
    """
    search_pattern = f"%{q}%"
    
    # Поиск в топиках
    threads = db.query(ForumThread).options(joinedload(ForumThread.user)).filter(
        or_(
            ForumThread.title.ilike(search_pattern),
            ForumThread.content.ilike(search_pattern)
        )
    ).limit(10).all()
    
    # Поиск в комментариях
    posts = db.query(ForumPost).options(
        joinedload(ForumPost.user),
        joinedload(ForumPost.thread)
    ).filter(
        ForumPost.content.ilike(search_pattern)
    ).limit(10).all()
    
    results = []
    
    # Добавляем топики
    for thread in threads:
        results.append({
            "type": "thread",
            "id": thread.id,
            "title": thread.title,
            "content": thread.content[:200] + "..." if len(thread.content) > 200 else thread.content,
            "thread_id": None,
            "created_at": thread.created_at,
            "author": {
                "id": thread.user.id,
                "full_name": thread.user.full_name,
            } if thread.user else None,
        })
    
    # Добавляем комментарии
    for post in posts:
        results.append({
            "type": "post",
            "id": post.id,
            "title": post.thread.title if post.thread else None,
            "content": post.content[:200] + "..." if len(post.content) > 200 else post.content,
            "thread_id": post.thread_id,
            "created_at": post.created_at,
            "author": {
                "id": post.user.id,
                "full_name": post.user.full_name,
            } if post.user else None,
        })
    
    return {
        "items": results,
        "total": len(results),
    }


# ===== Endpoints для модераторов =====

@router.delete("/threads/{thread_id}/moderate", status_code=status.HTTP_200_OK)
def moderate_delete_thread(
    thread_id: int,
    ban_user: bool = Query(False, description="Ban the thread author"),
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Удалить топик (только для модераторов)
    
    Опционально можно забанить автора топика.
    Требует роль moderator или admin.
    """
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    author_id = thread.user_id
    thread_title = thread.title
    
    # Удаляем топик (cascade удалит все комментарии)
    db.delete(thread)
    
    # Опционально баним автора
    if ban_user:
        author = db.query(User).filter(User.id == author_id).first()
        if author:
            author.is_active = False
            logger.warning(f"Moderator {moderator.id} banned user {author_id}")
    
    db.commit()
    
    logger.info(f"Moderator {moderator.id} deleted thread {thread_id} ('{thread_title}')")
    
    return {
        "status": "deleted",
        "thread_id": thread_id,
        "banned_user": ban_user
    }


@router.delete("/posts/{post_id}/moderate", status_code=status.HTTP_200_OK)
def moderate_delete_post(
    post_id: int,
    ban_user: bool = Query(False, description="Ban the post author"),
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Удалить комментарий (только для модераторов)
    
    Опционально можно забанить автора комментария.
    Требует роль moderator или admin.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    author_id = post.user_id
    
    # Удаляем комментарий (cascade удалит все вложенные ответы)
    db.delete(post)
    
    # Опционально баним автора
    if ban_user:
        author = db.query(User).filter(User.id == author_id).first()
        if author:
            author.is_active = False
            logger.warning(f"Moderator {moderator.id} banned user {author_id}")
    
    db.commit()
    
    logger.info(f"Moderator {moderator.id} deleted post {post_id}")
    
    return {
        "status": "deleted",
        "post_id": post_id,
        "banned_user": ban_user
    }


@router.post("/users/{user_id}/ban", status_code=status.HTTP_200_OK)
def ban_user(
    user_id: int,
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Забанить пользователя (только для модераторов)
    
    Устанавливает is_active = False для пользователя.
    Требует роль moderator или admin.
    """
    if user_id == moderator.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot ban yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    logger.warning(f"Moderator {moderator.id} banned user {user_id}")
    
    return {
        "status": "banned",
        "user_id": user_id
    }


@router.post("/users/{user_id}/unban", status_code=status.HTTP_200_OK)
def unban_user(
    user_id: int,
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Разбанить пользователя (только для модераторов)
    
    Устанавливает is_active = True для пользователя.
    Требует роль moderator или admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    logger.info(f"Moderator {moderator.id} unbanned user {user_id}")
    
    return {
        "status": "unbanned",
        "user_id": user_id
    }

