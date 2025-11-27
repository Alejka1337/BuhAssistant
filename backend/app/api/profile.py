from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.user import User, UserType, FOPGroup
from app.schemas.user import UserProfileUpdate, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/me", response_model=UserResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Получение профиля текущего пользователя
    """
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновление профиля текущего пользователя
    """
    update_data = profile_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)
            
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)


@router.get("/health")
def profile_health():
    """Health check для profile API"""
    return {
        "status": "healthy",
        "service": "profile",
        "endpoints": {
            "me_get": "GET /api/profile/me",
            "me_put": "PUT /api/profile/me (update profile)",
        }
    }
