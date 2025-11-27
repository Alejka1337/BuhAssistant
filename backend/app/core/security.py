"""
Security utilities для работы с паролями и JWT токенами
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Настройка для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создание JWT access token
    
    Args:
        data: Данные для токена (обычно {"sub": user_id})
        expires_delta: Время жизни токена (по умолчанию из настроек)
    
    Returns:
        JWT токен
    """
    to_encode = data.copy()
    
    # JWT требует, чтобы "sub" (subject) был строкой
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Создание JWT refresh token
    
    Args:
        data: Данные для токена (обычно {"sub": user_id})
    
    Returns:
        JWT refresh токен
    """
    to_encode = data.copy()
    
    # JWT требует, чтобы "sub" (subject) был строкой
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Декодирование JWT токена
    
    Args:
        token: JWT токен
    
    Returns:
        Payload токена или None если токен невалиден
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("JWT decode error: Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"JWT decode error: Invalid token - {str(e)}")
        return None
    except JWTError as e:
        print(f"JWT decode error: {str(e)}")
        return None

