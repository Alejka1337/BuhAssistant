"""
Pydantic схемы для Google OAuth2
"""
from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    """Запрос на авторизацию через Google (с токеном или кодом от клиента)"""
    token: str | None = None  # Google ID token от клиента (Web Client ID)
    code: str | None = None  # Authorization code от клиента (iOS Client ID)
    redirect_uri: str | None = None  # Redirect URI для обмена кода (требуется для code flow)
    client_id: str | None = None  # Client ID который использовался для получения кода/токена


class GoogleUserInfo(BaseModel):
    """Информация о пользователе из Google"""
    email: EmailStr
    name: str | None = None
    picture: str | None = None
    google_id: str


class GoogleAuthCallbackRequest(BaseModel):
    """Callback от Google OAuth (для web flow)"""
    code: str
    state: str | None = None

