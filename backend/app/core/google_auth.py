"""
Google OAuth2 utilities
"""
from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from app.core.config import settings
from app.schemas.google_auth import GoogleUserInfo
import logging

logger = logging.getLogger(__name__)


async def verify_google_token(token: str) -> GoogleUserInfo:
    """
    Верификация Google ID token и извлечение информации о пользователе
    
    Args:
        token: Google ID token от клиента
        
    Returns:
        GoogleUserInfo с данными пользователя
        
    Raises:
        ValueError: Если токен невалиден
    """
    # Список допустимых Client IDs (Web + iOS)
    VALID_CLIENT_IDS = [
        settings.GOOGLE_CLIENT_ID,  # Web Client ID
        settings.GOOGLE_IOS_CLIENT_ID,  # iOS Client ID
    ]
    
    # Пробуем верифицировать с каждым Client ID
    last_error = None
    for client_id in VALID_CLIENT_IDS:
        if not client_id:  # Пропускаем пустые
            continue
            
        try:
            # Верифицируем токен через Google API
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                client_id
            )
            
            # Проверяем issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            # Проверяем audience (должна совпадать с одним из наших Client IDs)
            if idinfo['aud'] not in VALID_CLIENT_IDS:
                logger.warning(f"Token audience {idinfo['aud']} not in valid list")
                continue
            
            # Успешная верификация!
            logger.info(f"Successfully verified token with client_id: {client_id[:20]}...")
            
            # Извлекаем информацию о пользователе
            return GoogleUserInfo(
                email=idinfo['email'],
                name=idinfo.get('name'),
                picture=idinfo.get('picture'),
                google_id=idinfo['sub']
            )
        except ValueError as e:
            last_error = e
            logger.warning(f"Verification failed with client_id {client_id[:20]}...: {e}")
            continue
        except Exception as e:
            last_error = e
            logger.warning(f"Unexpected error with client_id {client_id[:20]}...: {e}")
            continue
    
    # Если ни один Client ID не подошел
    error_msg = f"Invalid Google token: {str(last_error)}" if last_error else "Invalid Google token"
    logger.error(f"Google token verification failed with all client IDs: {error_msg}")
    raise ValueError(error_msg)


def create_google_oauth_flow() -> Flow:
    """
    Создание Google OAuth2 flow для web приложений
    
    Returns:
        Configured Flow object
    """
    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        },
        scopes=[
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
    )
    
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    return flow


def get_google_auth_url() -> str:
    """
    Получение URL для редиректа пользователя на страницу авторизации Google
    
    Returns:
        Authorization URL
    """
    flow = create_google_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    return authorization_url


async def exchange_code_for_token(
    code: str, 
    redirect_uri: str | None = None,
    client_id: str | None = None
) -> GoogleUserInfo:
    """
    Обмен authorization code на access token и получение информации о пользователе
    
    Args:
        code: Authorization code от Google
        redirect_uri: Redirect URI который был использован при получении кода (КРИТИЧНО!)
        client_id: Client ID который был использован для получения кода (опционально, по умолчанию Web Client ID)
        
    Returns:
        GoogleUserInfo с данными пользователя
        
    Raises:
        ValueError: Если код невалиден
    """
    try:
        # Используем переданный redirect_uri или дефолтный из settings
        actual_redirect_uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
        
        logger.error(f"🔄 Starting code exchange...")
        logger.error(f"📍 Redirect URI: {actual_redirect_uri}")
        logger.error(f"🔑 Code length: {len(code) if code else 0}")
        
        # КРИТИЧНО: Для обмена кода ВСЕГДА используем Web Client ID + Client Secret
        # Даже если код был получен с помощью iOS Client ID!
        # iOS Client ID используется только для получения кода на фронте,
        # но обмен кода на токен ДОЛЖЕН делаться через Web Client ID на сервере
        if client_id and client_id == settings.GOOGLE_IOS_CLIENT_ID:
            logger.error(f"🍎 Code was obtained with iOS Client ID: {client_id[:20]}...")
            logger.error(f"🔄 But will exchange using Web Client ID for server-side flow")
        
        # Всегда используем Web Client ID для обмена
        actual_client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET
        
        logger.error(f"🆔 Client ID for exchange: {actual_client_id[:20]}...")
        logger.error(f"🔐 Using client secret: {'Yes' if client_secret else 'No'}")
        
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": actual_client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [actual_redirect_uri]
                }
            },
            scopes=[
                'openid',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ]
        )
        
        flow.redirect_uri = actual_redirect_uri
        logger.error(f"✅ Flow created, fetching token...")
        
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Получаем информацию о пользователе
        request = requests.Request()
        idinfo = id_token.verify_oauth2_token(
            credentials.id_token,
            request,
            settings.GOOGLE_CLIENT_ID
        )
        
        logger.info(f"Successfully exchanged code for user: {idinfo.get('email')}")
        
        return GoogleUserInfo(
            email=idinfo['email'],
            name=idinfo.get('name'),
            picture=idinfo.get('picture'),
            google_id=idinfo['sub']
        )
    except Exception as e:
        import traceback
        logger.error(f"❌ Failed to exchange code for token: {e}")
        logger.error(f"📋 Full traceback: {traceback.format_exc()}")
        logger.error(f"🔑 Code was: {code[:20]}... (length: {len(code)})")
        logger.error(f"📍 Redirect URI was: {actual_redirect_uri}")
        raise ValueError(f"Invalid authorization code: {str(e)}")

