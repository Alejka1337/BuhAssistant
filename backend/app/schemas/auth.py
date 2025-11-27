"""
Pydantic схемы для авторизации
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """Схема для регистрации пользователя"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Схема для логина"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Схема для токенов"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Данные из токена"""
    user_id: Optional[int] = None
    email: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Запрос на обновление токена"""
    refresh_token: str


class UserResponse(BaseModel):
    """Схема для ответа с данными пользователя"""
    id: int
    email: str
    full_name: Optional[str] = None
    user_type: Optional[str] = None
    fop_group: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Полный ответ после авторизации (токены + данные пользователя)"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerifyEmailRequest(BaseModel):
    """Запрос на верификацию email"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, description="6-значный код активации")


class ResendCodeRequest(BaseModel):
    """Запрос на повторную отправку кода активации"""
    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Запрос на сброс пароля (отправка кода)"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Подтверждение сброса пароля (ввод кода и нового пароля)"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, description="6-значный код сброса пароля")
    new_password: str = Field(..., min_length=6, max_length=100, description="Новый пароль")

