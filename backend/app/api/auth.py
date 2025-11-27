"""
Endpoints для авторизации
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import logging
import random

logger = logging.getLogger(__name__)
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    AuthResponse,
    RefreshTokenRequest,
    UserResponse,
    VerifyEmailRequest,
    ResendCodeRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.api.deps import get_current_user
from app.schemas.google_auth import GoogleAuthRequest, GoogleUserInfo
from app.core.google_auth import verify_google_token, get_google_auth_url, exchange_code_for_token
from app.services.email_service import (
    generate_activation_code,
    get_activation_code_expiry,
    send_activation_email,
    send_password_reset_email,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя
    
    - **email**: Email пользователя (уникальный)
    - **password**: Пароль (минимум 6 символов)
    - **full_name**: Полное имя (опционально)
    
    После регистрации пользователю отправляется код активации на email.
    Пользователь должен активировать аккаунт через /api/auth/verify
    """
    # Проверяем, существует ли пользователь с таким email
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Генерируем код активации
    activation_code = generate_activation_code()
    activation_code_expires_at = get_activation_code_expiry()
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        is_verified=False,  # Пользователь не верифицирован до активации
        activation_code=activation_code,
        activation_code_expires_at=activation_code_expires_at
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Отправляем email с кодом активации
    email_sent = send_activation_email(
        email=user_data.email,
        activation_code=activation_code,
        user_name=user_data.full_name
    )
    
    if not email_sent:
        # Если не удалось отправить email, удаляем пользователя
        db.delete(new_user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send activation email. Please try again later."
        )
    
    # Создаем токены (пользователь может использовать их для верификации)
    access_token = create_access_token(data={"sub": new_user.id})
    refresh_token = create_refresh_token(data={"sub": new_user.id})
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.from_orm(new_user)
    )


@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Вход в систему
    
    - **email**: Email пользователя
    - **password**: Пароль
    """
    # Ищем пользователя по email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Проверяем пароль
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Проверяем, активен ли пользователь
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Не блокируем вход для невертифицированных пользователей
    # Фронтенд проверит is_verified и перенаправит на экран верификации при необходимости
    
    # Создаем токены
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Обновляем last_login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Обновление access token с помощью refresh token
    
    - **refresh_token**: Refresh token полученный при логине
    """
    # Декодируем refresh token
    payload = decode_token(token_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Проверяем тип токена
    token_type = payload.get("type")
    if token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Получаем user_id (JWT хранит sub как строку)
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Конвертируем строку в int
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in refresh token"
        )
    
    # Ищем пользователя
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Создаем новые токены
    new_access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    return AuthResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Получение информации о текущем пользователе
    
    Требует авторизации (JWT token в заголовке Authorization: Bearer <token>)
    """
    return UserResponse.from_orm(current_user)


@router.post("/google", response_model=AuthResponse)
async def google_auth(google_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Авторизация через Google (для мобильных приложений)
    
    Поддерживает 2 способа:
    - **token**: Google ID token от клиента (Web Client ID, implicit flow)
    - **code + redirect_uri**: Authorization code от клиента (iOS Client ID, code flow)
    
    Этот endpoint используется мобильными приложениями для авторизации через Google.
    """
    try:
        # Логируем входящие данные для отладки
        logger.info(f"Google auth request: code={google_data.code is not None}, token={google_data.token is not None}, redirect_uri={google_data.redirect_uri}, client_id={google_data.client_id[:20] if google_data.client_id else None}...")
        
        # Определяем какой flow используется
        if google_data.code:
            # Code flow (iOS Client ID или Web Client ID)
            if not google_data.redirect_uri:
                raise ValueError("redirect_uri is required for code flow")
            
            logger.info(f"Using code flow with redirect_uri: {google_data.redirect_uri}")
            
            # Обмениваем код на токены и получаем информацию о пользователе
            # ВАЖНО: передаем redirect_uri И client_id который использовался при получении кода!
            google_user: GoogleUserInfo = await exchange_code_for_token(
                google_data.code, 
                google_data.redirect_uri,
                google_data.client_id
            )
        elif google_data.token:
            # Token flow (Web Client ID, implicit)
            google_user: GoogleUserInfo = await verify_google_token(google_data.token)
        else:
            raise ValueError("Either 'token' or 'code' must be provided")
        
        # Ищем пользователя по email или google_id
        user = db.query(User).filter(
            (User.email == google_user.email) | (User.google_id == google_user.google_id)
        ).first()
        
        # Если пользователь не найден, создаем нового
        if not user:
            user = User(
                email=google_user.email,
                full_name=google_user.name,
                google_id=google_user.google_id,
                hashed_password=None,  # Нет пароля для Google OAuth
                is_active=True,
                is_verified=True,  # Google уже верифицировал email
            )
            db.add(user)
        else:
            # Если пользователь существует, обновляем google_id (если нужно)
            if not user.google_id:
                user.google_id = google_user.google_id
            
            # Обновляем full_name если он пустой
            if not user.full_name and google_user.name:
                user.full_name = google_user.name
        
        # Обновляем last_login
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        
        # Создаем токены
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )


@router.get("/google/url")
def get_google_login_url():
    """
    Получение URL для редиректа на страницу авторизации Google (для web)
    
    Этот endpoint используется web-приложениями для получения URL,
    на который нужно перенаправить пользователя для авторизации через Google.
    
    Returns:
        {"url": "https://accounts.google.com/o/oauth2/auth?..."}
    """
    try:
        auth_url = get_google_auth_url()
        return {"url": auth_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Google auth URL: {str(e)}"
        )


@router.post("/verify", response_model=AuthResponse)
def verify_email(
    verify_data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Верификация email с помощью кода активации
    
    - **email**: Email пользователя
    - **code**: 6-значный код активации, полученный на email
    
    Не требует авторизации - верификация происходит по email и коду
    """
    # Ищем пользователя по email
    user = db.query(User).filter(User.email == verify_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Проверяем, что пользователь еще не верифицирован
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Проверяем код активации
    if not user.activation_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No activation code found. Please request a new code."
        )
    
    if user.activation_code != verify_data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid activation code"
        )
    
    # Проверяем срок действия кода (используем timezone-aware datetime)
    if user.activation_code_expires_at:
        now = datetime.now(timezone.utc)
        if user.activation_code_expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activation code expired. Please request a new code."
            )
    
    # Активируем пользователя
    user.is_verified = True
    user.activation_code = None
    user.activation_code_expires_at = None
    db.commit()
    db.refresh(user)
    
    # Создаем новые токены
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.post("/resend-code")
def resend_activation_code(resend_data: ResendCodeRequest, db: Session = Depends(get_db)):
    """
    Повторная отправка кода активации на email
    
    - **email**: Email адрес пользователя
    
    Генерирует новый код активации и отправляет его на указанный email.
    """
    # Ищем пользователя по email
    user = db.query(User).filter(User.email == resend_data.email).first()
    if not user:
        # Не раскрываем, существует ли пользователь (security best practice)
        return {
            "message": "If the email exists and is not verified, a new activation code has been sent."
        }
    
    # Проверяем, не верифицирован ли уже пользователь
    if user.is_verified:
        return {
            "message": "If the email exists and is not verified, a new activation code has been sent."
        }
    
    # Генерируем новый код активации
    activation_code = generate_activation_code()
    activation_code_expires_at = get_activation_code_expiry()
    
    # Обновляем код в БД
    user.activation_code = activation_code
    user.activation_code_expires_at = activation_code_expires_at
    db.commit()
    
    # Отправляем email
    email_sent = send_activation_email(
        email=user.email,
        activation_code=activation_code,
        user_name=user.full_name
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send activation email. Please try again later."
        )
    
    return {
        "message": "If the email exists and is not verified, a new activation code has been sent."
    }


@router.post("/password-reset/request")
async def request_password_reset(
    data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Запрос на сброс пароля - отправка кода на email
    
    Если пользователь с таким email существует, отправляем код сброса пароля.
    Всегда возвращаем успех для безопасности (не раскрываем существование email).
    """
    # Ищем пользователя
    user = db.query(User).filter(User.email == data.email).first()
    
    if user:
        # Генерируем 6-значный код
        reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Сохраняем код и время истечения (15 минут)
        user.reset_password_code = reset_code
        user.reset_password_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
        
        # Отправляем email с кодом
        try:
            await send_password_reset_email(user.email, reset_code)
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {e}")
            # Не раскрываем ошибку пользователю
    
    # Всегда возвращаем успех для безопасности
    return {
        "success": True,
        "message": "If the email exists, a password reset code has been sent."
    }


@router.post("/password-reset/confirm")
def confirm_password_reset(
    data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Подтверждение сброса пароля - проверка кода и установка нового пароля
    """
    # Ищем пользователя
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or code"
        )
    
    # Проверяем наличие кода
    if not user.reset_password_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No password reset request found. Please request a new code."
        )
    
    # Проверяем истечение кода
    if user.reset_password_code_expires_at < datetime.now(timezone.utc):
        # Удаляем истекший код
        user.reset_password_code = None
        user.reset_password_code_expires_at = None
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one."
        )
    
    # Проверяем код
    if user.reset_password_code != data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code"
        )
    
    # Обновляем пароль
    user.hashed_password = get_password_hash(data.new_password)
    
    # Удаляем код сброса
    user.reset_password_code = None
    user.reset_password_code_expires_at = None
    
    db.commit()
    
    return {
        "success": True,
        "message": "Password has been reset successfully. You can now log in with your new password."
    }


@router.get("/health")
def auth_health():
    """Health check для auth API"""
    return {
        "status": "healthy",
        "service": "auth",
        "endpoints": {
            "register": "POST /api/auth/register",
            "login": "POST /api/auth/login",
            "refresh": "POST /api/auth/refresh",
            "verify": "POST /api/auth/verify (Email verification)",
            "resend-code": "POST /api/auth/resend-code (Resend activation code)",
            "password-reset/request": "POST /api/auth/password-reset/request",
            "password-reset/confirm": "POST /api/auth/password-reset/confirm",
            "me": "GET /api/auth/me (protected)",
            "google": "POST /api/auth/google (Google OAuth2)",
            "google_url": "GET /api/auth/google/url (Get auth URL)",
        }
    }

