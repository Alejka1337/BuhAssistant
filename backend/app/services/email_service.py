"""
Сервис для отправки email
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime, timedelta, timezone
import secrets
import string
from app.core.config import settings


def generate_activation_code(length: int = 6) -> str:
    """
    Генерация случайного кода активации
    
    Args:
        length: Длина кода (по умолчанию 6 символов)
    
    Returns:
        Случайный код из цифр
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def get_activation_code_expiry(hours: int = 24) -> datetime:
    """
    Получение времени истечения кода активации
    
    Args:
        hours: Количество часов до истечения (по умолчанию 24)
    
    Returns:
        datetime объект с временем истечения (timezone-aware)
    """
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def send_activation_email(email: str, activation_code: str, user_name: Optional[str] = None) -> bool:
    """
    Отправка email с кодом активации
    
    Args:
        email: Email адрес получателя
        activation_code: Код активации
        user_name: Имя пользователя (опционально)
    
    Returns:
        True если письмо отправлено успешно, False в противном случае
    """
    try:
        # Создаем сообщение
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = 'Підтвердження реєстрації - eGlavBuh'
        
        # Формируем текст письма
        greeting = f"Вітаємо, {user_name}!" if user_name else "Вітаємо!"
        
        text_content = f"""
{greeting}

Дякуємо за реєстрацію в eGlavBuh!

Ваш код активації: {activation_code}

Введіть цей код в додатку для підтвердження вашого email адресу.

Код дійсний протягом 24 годин.

Якщо ви не реєструвалися в eGlavBuh, просто проігноруйте це повідомлення.

З повагою,
Команда eGlavBuh
        """
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #ecf0f1;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #1a1d21;
        }}
        .container {{
            background-color: #22262c;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }}
        .header {{
            background: linear-gradient(135deg, #1e3a20 0%, #2d5a31 100%);
            color: #282;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #282;
        }}
        .header h1 {{
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }}
        .content {{
            background-color: #22262c;
            padding: 40px 30px;
            color: #ecf0f1;
        }}
        .content p {{
            margin: 15px 0;
            color: #ecf0f1;
        }}
        .code {{
            background: linear-gradient(135deg, #1a1d21 0%, #2c3e50 100%);
            color: #282;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 25px;
            margin: 30px 0;
            border-radius: 12px;
            letter-spacing: 10px;
            border: 2px solid #282;
            box-shadow: 0 4px 15px rgba(40, 130, 34, 0.2);
        }}
        .info-box {{
            background-color: #1a1d21;
            border-left: 4px solid #282;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            background-color: #1a1d21;
            margin-top: 0;
            padding: 25px;
            border-top: 2px solid #282;
            color: #7f8c8d;
            font-size: 13px;
            text-align: center;
        }}
        .footer strong {{
            color: #282;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ eGlavBuh</h1>
        </div>
        <div class="content">
            <p><strong>{greeting}</strong></p>
            <p>Дякуємо за реєстрацію в <strong style="color: #282;">eGlavBuh</strong> – надійному помічнику у бухгалтерії!</p>
            <p>Ваш код активації:</p>
            <div class="code">{activation_code}</div>
            <p>Введіть цей код в додатку для підтвердження вашого email адресу.</p>
            <div class="info-box">
                <p style="margin: 0;"><strong>⏱️ Код дійсний протягом 24 годин.</strong></p>
            </div>
            <p style="color: #7f8c8d; font-size: 14px;">Якщо ви не реєструвалися в eGlavBuh, просто проігноруйте це повідомлення.</p>
        </div>
        <div class="footer">
            <p>З повагою,<br><strong>Команда eGlavBuh</strong></p>
            <p style="margin-top: 15px; font-size: 11px;">© 2025 eGlavBuh. Всі права захищені.</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Добавляем текстовую и HTML версии
        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Отправляем письмо
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending activation email: {str(e)}")
        return False


async def send_password_reset_email(email: str, reset_code: str, user_name: Optional[str] = None) -> bool:
    """
    Отправка email с кодом сброса пароля
    
    Args:
        email: Email адрес получателя
        reset_code: Код сброса пароля
        user_name: Имя пользователя (опционально)
    
    Returns:
        True если письмо отправлено успешно, False в противном случае
    """
    try:
        # Создаем сообщение
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = 'Скидання пароля - eGlavBuh'
        
        # Формируем текст письма
        greeting = f"Вітаємо, {user_name}!" if user_name else "Вітаємо!"
        
        text_content = f"""
{greeting}

Ви запросили скидання пароля для вашого облікового запису eGlavBuh.

Ваш код для скидання пароля: {reset_code}

Введіть цей код в додатку та встановіть новий пароль.

Код дійсний протягом 15 хвилин.

Якщо ви не запитували скидання пароля, просто проігноруйте це повідомлення. Ваш пароль залишиться без змін.

З повагою,
Команда eGlavBuh
        """
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #ecf0f1;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #1a1d21;
        }}
        .container {{
            background-color: #22262c;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }}
        .header {{
            background: linear-gradient(135deg, #3a1e1e 0%, #5a2d2d 100%);
            color: #e74c3c;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #e74c3c;
        }}
        .header h1 {{
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }}
        .content {{
            background-color: #22262c;
            padding: 40px 30px;
            color: #ecf0f1;
        }}
        .content p {{
            margin: 15px 0;
            color: #ecf0f1;
        }}
        .code {{
            background: linear-gradient(135deg, #1a1d21 0%, #2c3e50 100%);
            color: #e74c3c;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 25px;
            margin: 30px 0;
            border-radius: 12px;
            letter-spacing: 10px;
            border: 2px solid #e74c3c;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.2);
        }}
        .info-box {{
            background-color: #1a1d21;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning {{
            background-color: #3a2520;
            border-left: 4px solid #f39c12;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #f39c12;
        }}
        .footer {{
            background-color: #1a1d21;
            margin-top: 0;
            padding: 25px;
            border-top: 2px solid #e74c3c;
            color: #7f8c8d;
            font-size: 13px;
            text-align: center;
        }}
        .footer strong {{
            color: #282;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 eGlavBuh</h1>
        </div>
        <div class="content">
            <p><strong>{greeting}</strong></p>
            <p>Ви запросили скидання пароля для вашого облікового запису <strong style="color: #282;">eGlavBuh</strong>.</p>
            <p>Ваш код для скидання пароля:</p>
            <div class="code">{reset_code}</div>
            <p>Введіть цей код в додатку та встановіть новий пароль.</p>
            <div class="info-box">
                <p style="margin: 0;"><strong>⏱️ Код дійсний протягом 15 хвилин.</strong></p>
            </div>
            <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Увага!</strong> Якщо ви не запитували скидання пароля, просто проігноруйте це повідомлення. Ваш пароль залишиться без змін.</p>
            </div>
        </div>
        <div class="footer">
            <p>З повагою,<br><strong>Команда eGlavBuh</strong></p>
            <p style="margin-top: 15px; font-size: 11px;">© 2025 eGlavBuh. Всі права захищені.</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Добавляем текстовую и HTML версии
        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Отправляем письмо
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending password reset email: {str(e)}")
        return False

