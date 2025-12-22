"""
Endpoints для формы консультации
"""
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

from app.core.config import settings

router = APIRouter(prefix="/api/consultation", tags=["consultation"])

# Email администраторов для получения заявок на консультацию
ADMIN_EMAILS = [
    "dmitrjialekseev16@gmail.com",  # Email администратора для получения заявок
    "o.vishnyakovaf@gmail.com"       # Дополнительный email для бухгалтера
]


@router.post("/submit")
async def submit_consultation(
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(default=""),
    audio_file: Optional[UploadFile] = File(default=None)
):
    """
    Отправка формы консультации
    
    - **name**: Имя клиента
    - **email**: Email клиента для связи
    - **message**: Текстовое сообщение (опционально)
    - **audio_file**: Голосовое сообщение (опционально)
    """
    try:
        # Создаем email сообщение
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_EMAIL
        msg['To'] = ', '.join(ADMIN_EMAILS)  # Отправляем на все email адреса
        msg['Subject'] = f'Нова заявка на консультацію від {name}'
        
        # Формируем текст письма
        current_time = datetime.now().strftime("%d.%m.%Y %H:%M")
        
        email_body = f"""
Нова заявка на консультацію

Дата та час: {current_time}

Ім'я клієнта: {name}
Email для зв'язку: {email}

Повідомлення:
{message if message else "(Не вказано)"}

{"Голосове повідомлення додано у вкладенні." if audio_file else "Голосового повідомлення немає."}

---
Відправлено з BuhAssistant
        """
        
        # Добавляем текст письма
        msg.attach(MIMEText(email_body, 'plain', 'utf-8'))
        
        # Если есть аудио-файл, прикрепляем его
        if audio_file:
            try:
                # Читаем содержимое файла
                audio_content = await audio_file.read()
                
                # Создаем attachment
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(audio_content)
                encoders.encode_base64(part)
                
                # Определяем имя файла
                filename = audio_file.filename or f"voice_message_{datetime.now().strftime('%Y%m%d_%H%M%S')}.m4a"
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {filename}'
                )
                
                msg.attach(part)
            except Exception as e:
                print(f"Error attaching audio file: {str(e)}")
                # Продолжаем даже если не удалось прикрепить файл
        
        # Отправляем email
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return {
            "success": True,
            "message": "Заявка успішно відправлена"
        }
        
    except Exception as e:
        print(f"Error sending consultation email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не вдалося відправити заявку: {str(e)}"
        )


@router.get("/health")
def consultation_health():
    """Health check для consultation API"""
    return {
        "status": "healthy",
        "service": "consultation",
        "endpoints": {
            "submit": "POST /api/consultation/submit (multipart/form-data)",
        }
    }

