"""
Dependencies для проверки ролей пользователей
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user


def get_current_moderator(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Проверяет что текущий пользователь является модератором или админом.
    
    Args:
        current_user: Текущий аутентифицированный пользователь
        
    Returns:
        User: Пользователь с ролью moderator или admin
        
    Raises:
        HTTPException: Если пользователь не имеет прав модератора
    """
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Moderator or admin role required."
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Проверяет что текущий пользователь является админом.
    
    Args:
        current_user: Текущий аутентифицированный пользователь
        
    Returns:
        User: Пользователь с ролью admin
        
    Raises:
        HTTPException: Если пользователь не является админом
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required."
        )
    return current_user

