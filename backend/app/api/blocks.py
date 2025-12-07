"""
API endpoints для блокировки пользователей
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
import logging

from app.db.database import get_db
from app.models.user import User
from app.models.report import UserBlock
from app.schemas.report import UserBlockCreate, UserBlockResponse
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/blocks", tags=["blocks"])


@router.post("", response_model=UserBlockResponse, status_code=status.HTTP_201_CREATED)
def block_user(
    block_data: UserBlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Заблокировать пользователя
    
    Требует авторизации. После блокировки контент заблокированного пользователя
    не будет отображаться в вашей ленте.
    """
    # Проверяем, что пользователь не блокирует сам себя
    if block_data.blocked_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot block yourself"
        )
    
    # Проверяем, существует ли пользователь для блокировки
    blocked_user = db.query(User).filter(User.id == block_data.blocked_id).first()
    if not blocked_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Проверяем, не заблокирован ли уже этот пользователь
    existing_block = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == block_data.blocked_id
    ).first()
    
    if existing_block:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already blocked"
        )
    
    # Создаём блокировку
    new_block = UserBlock(
        blocker_id=current_user.id,
        blocked_id=block_data.blocked_id
    )
    
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    
    logger.info(f"User {current_user.id} blocked user {block_data.blocked_id}")
    
    return new_block


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Разблокировать пользователя
    
    Требует авторизации. Удаляет блокировку указанного пользователя.
    """
    # Ищем блокировку
    block = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == user_id
    ).first()
    
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found"
        )
    
    db.delete(block)
    db.commit()
    
    logger.info(f"User {current_user.id} unblocked user {user_id}")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("", response_model=List[UserBlockResponse])
def get_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список заблокированных пользователей
    
    Требует авторизации. Возвращает всех пользователей, которых вы заблокировали.
    """
    from sqlalchemy.orm import joinedload
    
    blocks = db.query(UserBlock).options(
        joinedload(UserBlock.blocked)
    ).filter(
        UserBlock.blocker_id == current_user.id
    ).order_by(UserBlock.created_at.desc()).all()
    
    # Формируем ответ с информацией о заблокированном пользователе
    result = []
    for block in blocks:
        block_dict = {
            "id": block.id,
            "blocker_id": block.blocker_id,
            "blocked_id": block.blocked_id,
            "created_at": block.created_at,
            "blocked_user": {
                "email": block.blocked.email,
                "full_name": block.blocked.full_name,
            } if block.blocked else None
        }
        result.append(block_dict)
    
    return result


@router.get("/ids", response_model=List[int])
def get_blocked_user_ids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список ID заблокированных пользователей
    
    Требует авторизации. Возвращает только ID пользователей для фильтрации контента.
    """
    blocked_ids = db.query(UserBlock.blocked_id).filter(
        UserBlock.blocker_id == current_user.id
    ).all()
    
    return [blocked_id[0] for blocked_id in blocked_ids]

