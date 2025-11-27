"""
Dependencies для FastAPI endpoints
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.core.security import decode_token
from app.models.user import User

# HTTP Bearer security scheme
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Получение текущего пользователя из JWT токена
    
    Raises:
        HTTPException: Если токен невалиден или пользователь не найден
    """
    token = credentials.credentials
    
    # Логируем для отладки (только первые 20 символов)
    print(f"Received token: {token[:20]}...")
    
    # Декодируем токен
    payload = decode_token(token)
    if payload is None:
        print("Token decode failed - payload is None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем тип токена (должен быть access)
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Получаем user_id из токена (JWT хранит sub как строку)
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Конвертируем строку в int
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ищем пользователя в БД
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Проверяем, активен ли пользователь
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Получение текущего активного пользователя
    (дополнительная проверка на активность)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Получение текущего суперпользователя
    (для admin-only endpoints)
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Получение текущего пользователя из JWT токена (опционально)
    Возвращает None если токен не предоставлен
    Используется для endpoints, которые работают как для авторизованных, так и для неавторизованных
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    
    # Декодируем токен
    payload = decode_token(token)
    if payload is None:
        return None
    
    # Проверяем тип токена
    token_type = payload.get("type")
    if token_type != "access":
        return None
    
    # Получаем user_id
    user_id_str = payload.get("sub")
    if user_id_str is None:
        return None
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return None
    
    # Ищем пользователя
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        return None
    
    return user

