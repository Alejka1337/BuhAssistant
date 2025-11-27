from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.models.user import UserType, FOPGroup


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    user_type: Optional[UserType] = None
    fop_group: Optional[FOPGroup] = None
    tax_system: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    user_type: Optional[UserType] = None
    fop_group: Optional[FOPGroup] = None
    tax_system: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True
