"""
API endpoints для push-уведомлений
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.user import User
from app.models.notification import NotificationSettings
from app.schemas.notification import (
    PushTokenRegister,
    NotificationSettingsUpdate,
    NotificationSettingsResponse,
    TestNotificationRequest,
    NotificationResponse
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

