"""
API endpoints для push-уведомлений
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.notification import NotificationSettings
from app.models.push_token import AnonymousPushToken
from app.schemas.notification import (
    PushTokenRegister,
    NotificationSettingsUpdate,
    NotificationSettingsResponse,
    TestNotificationRequest,
    NotificationResponse
)
from app.schemas.push_token import (
    AnonymousPushTokenCreate,
    AnonymousPushTokenResponse,
    LinkTokenToUserRequest
)
from app.api.deps import get_current_user
from app.services.push_notification import push_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/push", tags=["push-notifications"])


@router.post("/register", response_model=NotificationResponse)
def register_push_token(
    token_data: PushTokenRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Регистрация или обновление push токена пользователя
    """
    try:
        # Обновляем push_token в модели User
        current_user.push_token = token_data.push_token
        
        # Создаем настройки уведомлений, если их еще нет
        if not current_user.notification_settings:
            settings = NotificationSettings(
                user_id=current_user.id,
                enable_deadline_notifications=True,
                enable_news_notifications=True,
                deadline_days_before=[1, 3]
            )
            db.add(settings)
        
        db.commit()
        
        logger.info(f"Push token registered for user {current_user.id}")
        
        return NotificationResponse(
            success=True,
            message="Push token registered successfully",
            details={"user_id": current_user.id}
        )
        
    except Exception as e:
        logger.error(f"Error registering push token: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register push token: {str(e)}"
        )


@router.get("/settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить настройки уведомлений пользователя
    """
    # Если настроек еще нет, создаем с дефолтными значениями
    if not current_user.notification_settings:
        settings = NotificationSettings(
            user_id=current_user.id,
            enable_deadline_notifications=True,
            enable_news_notifications=True,
            deadline_days_before=[1, 3]
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return NotificationSettingsResponse.from_orm(settings)
    
    return NotificationSettingsResponse.from_orm(current_user.notification_settings)


@router.put("/settings", response_model=NotificationSettingsResponse)
def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновить настройки уведомлений пользователя
    """
    try:
        # Получаем или создаем настройки
        if not current_user.notification_settings:
            settings = NotificationSettings(
                user_id=current_user.id,
                enable_deadline_notifications=True,
                enable_news_notifications=True,
                deadline_days_before=[1, 3]
            )
            db.add(settings)
            db.flush()
        else:
            settings = current_user.notification_settings
        
        # Обновляем поля
        update_data = settings_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        db.commit()
        db.refresh(settings)
        
        logger.info(f"Notification settings updated for user {current_user.id}")
        
        return NotificationSettingsResponse.from_orm(settings)
        
    except Exception as e:
        logger.error(f"Error updating notification settings: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )


@router.post("/test", response_model=NotificationResponse)
def send_test_notification(
    test_request: TestNotificationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Отправить тестовое уведомление текущему пользователю
    """
    logger.info(f"Test notification request: {test_request}")
    logger.info(f"Current user push_token: {current_user.push_token}")
    
    if not current_user.push_token:
        logger.warning(f"User {current_user.id} has no push token registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Push token not registered for this user"
        )
    
    try:
        result = push_service.send_push_notification(
            push_token=current_user.push_token,
            title=test_request.title,
            body=test_request.body,
            data=test_request.data
        )
        
        if result["success"]:
            return NotificationResponse(
                success=True,
                message="Test notification sent successfully",
                details=result
            )
        else:
            return NotificationResponse(
                success=False,
                message=f"Failed to send test notification: {result.get('error')}",
                details=result
            )
            
    except Exception as e:
        logger.error(f"Error sending test notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test notification: {str(e)}"
        )


@router.delete("/token", response_model=NotificationResponse)
def remove_push_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удалить push токен пользователя (при logout или отключении уведомлений)
    """
    try:
        current_user.push_token = None
        db.commit()
        
        logger.info(f"Push token removed for user {current_user.id}")
        
        return NotificationResponse(
            success=True,
            message="Push token removed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error removing push token: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove push token: {str(e)}"
        )


# === Endpoints для анонимных push токенов ===

@router.post("/register-anonymous", response_model=AnonymousPushTokenResponse)
def register_anonymous_push_token(
    token_data: AnonymousPushTokenCreate,
    db: Session = Depends(get_db)
):
    """
    Регистрация анонимного push токена для незарегистрированных пользователей.
    Позволяет отправлять push-уведомления о новостях до регистрации.
    """
    try:
        # Проверяем, существует ли уже такой токен
        existing_token = db.query(AnonymousPushToken).filter(
            AnonymousPushToken.token == token_data.token
        ).first()
        
        if existing_token:
            # Обновляем last_active_at
            existing_token.last_active_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_token)
            logger.info(f"Anonymous push token updated: {existing_token.id}")
            return AnonymousPushTokenResponse.from_orm(existing_token)
        
        # Создаем новый анонимный токен
        new_token = AnonymousPushToken(
            token=token_data.token,
            platform=token_data.platform,
            device_id=token_data.device_id
        )
        
        db.add(new_token)
        db.commit()
        db.refresh(new_token)
        
        logger.info(f"Anonymous push token registered: {new_token.id}, platform: {new_token.platform}")
        
        return AnonymousPushTokenResponse.from_orm(new_token)
        
    except Exception as e:
        logger.error(f"Error registering anonymous push token: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register anonymous push token: {str(e)}"
        )


@router.post("/link-to-user", response_model=NotificationResponse)
def link_anonymous_token_to_user(
    link_request: LinkTokenToUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Привязать анонимный push токен к зарегистрированному пользователю.
    Вызывается при регистрации или логине пользователя.
    """
    try:
        # Найти анонимный токен
        anonymous_token = db.query(AnonymousPushToken).filter(
            AnonymousPushToken.token == link_request.anonymous_token,
            AnonymousPushToken.is_linked_to_user.is_(None)
        ).first()
        
        if not anonymous_token:
            # Токен не найден или уже привязан - не критично
            logger.warning(f"Anonymous token not found or already linked: {link_request.anonymous_token[:20]}...")
            return NotificationResponse(
                success=False,
                message="Anonymous token not found or already linked"
            )
        
        # Перенести токен в User
        current_user.push_token = anonymous_token.token
        
        # Пометить анонимный токен как привязанный
        anonymous_token.is_linked_to_user = current_user.id
        
        # Создать настройки уведомлений, если их нет
        if not current_user.notification_settings:
            settings = NotificationSettings(
                user_id=current_user.id,
                enable_deadline_notifications=True,
                enable_news_notifications=True,
                deadline_days_before=[1, 3]
            )
            db.add(settings)
        
        db.commit()
        
        logger.info(f"Anonymous token {anonymous_token.id} linked to user {current_user.id}")
        
        return NotificationResponse(
            success=True,
            message="Anonymous token successfully linked to user",
            details={"user_id": current_user.id, "anonymous_token_id": anonymous_token.id}
        )
        
    except Exception as e:
        logger.error(f"Error linking anonymous token to user: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link anonymous token: {str(e)}"
        )

