"""
API для загрузки медиа-файлов (изображения, документы)
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
import os
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Директория для хранения файлов (на хосте, вне Docker)
# В Docker контейнере /app смонтировано к ./backend, поэтому используем относительный путь
import os
if os.path.exists("/app/app"):  # Мы в Docker
    # Используем путь на хосте через монтированный volume
    UPLOAD_DIR = Path("/app/static/uploads")
else:  # Локальная разработка
    UPLOAD_DIR = Path(__file__).parent.parent.parent / "static" / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Разрешенные типы файлов
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOC_EXTENSIONS

# Максимальный размер файла (10 МБ)
MAX_FILE_SIZE = 10 * 1024 * 1024


def get_file_extension(filename: str) -> str:
    """Получить расширение файла"""
    return Path(filename).suffix.lower()


def is_allowed_file(filename: str) -> bool:
    """Проверить, разрешен ли тип файла"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


def generate_unique_filename(original_filename: str) -> str:
    """Сгенерировать уникальное имя файла"""
    ext = get_file_extension(original_filename)
    unique_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{unique_id}{ext}"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Загрузка изображения (для обложек статей или контента)
    
    Требуется авторизация (модератор или админ)
    """
    # Проверка роли
    if current_user.role not in ['MODERATOR', 'ADMIN', 'moderator', 'admin']:
        raise HTTPException(status_code=403, detail="Only moderators and admins can upload images")
    
    # Проверка типа файла
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Читаем содержимое файла
    contents = await file.read()
    
    # Проверка размера
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024):.1f} MB"
        )
    
    # Генерируем уникальное имя и сохраняем
    filename = generate_unique_filename(file.filename)
    
    # Создаем подпапку для изображений по дате
    date_folder = datetime.now().strftime("%Y/%m")
    upload_path = UPLOAD_DIR / "images" / date_folder
    upload_path.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_path / filename
    
    # Сохраняем файл
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Возвращаем URL для доступа через media proxy (обход ngrok warning)
    file_url = f"/api/media/images/{date_folder}/{filename}"
    
    return {
        "success": True,
        "url": file_url,
        "filename": filename,
        "size": len(contents),
        "type": "image"
    }


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Загрузка документа (PDF, DOC, DOCX, XLS, XLSX)
    
    Требуется авторизация (модератор или админ)
    """
    # Проверка роли
    if current_user.role not in ['MODERATOR', 'ADMIN', 'moderator', 'admin']:
        raise HTTPException(status_code=403, detail="Only moderators and admins can upload documents")
    
    # Проверка типа файла
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_DOC_EXTENSIONS)}"
        )
    
    # Читаем содержимое файла
    contents = await file.read()
    
    # Проверка размера
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024):.1f} MB"
        )
    
    # Генерируем уникальное имя и сохраняем
    filename = generate_unique_filename(file.filename)
    
    # Создаем подпапку для документов по дате
    date_folder = datetime.now().strftime("%Y/%m")
    upload_path = UPLOAD_DIR / "documents" / date_folder
    upload_path.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_path / filename
    
    # Сохраняем файл
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Возвращаем URL для доступа через media proxy (обход ngrok warning)
    file_url = f"/api/media/documents/{date_folder}/{filename}"
    
    return {
        "success": True,
        "url": file_url,
        "filename": filename,
        "original_name": file.filename,
        "size": len(contents),
        "type": "document"
    }


@router.post("/multiple-images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Загрузка нескольких изображений за раз
    
    Требуется авторизация (модератор или админ)
    """
    # Проверка роли
    if current_user.role not in ['MODERATOR', 'ADMIN', 'moderator', 'admin']:
        raise HTTPException(status_code=403, detail="Only moderators and admins can upload images")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files at once")
    
    results = []
    errors = []
    
    for file in files:
        try:
            # Проверка типа файла
            if not file.filename:
                errors.append({"filename": "unknown", "error": "Filename is required"})
                continue
            
            ext = get_file_extension(file.filename)
            if ext not in ALLOWED_IMAGE_EXTENSIONS:
                errors.append({
                    "filename": file.filename, 
                    "error": f"Invalid file type: {ext}"
                })
                continue
            
            # Читаем содержимое файла
            contents = await file.read()
            
            # Проверка размера
            if len(contents) > MAX_FILE_SIZE:
                errors.append({
                    "filename": file.filename, 
                    "error": "File too large"
                })
                continue
            
            # Генерируем уникальное имя и сохраняем
            filename = generate_unique_filename(file.filename)
            
            # Создаем подпапку для изображений по дате
            date_folder = datetime.now().strftime("%Y/%m")
            upload_path = UPLOAD_DIR / "images" / date_folder
            upload_path.mkdir(parents=True, exist_ok=True)
            
            file_path = upload_path / filename
            
            # Сохраняем файл
            with open(file_path, "wb") as f:
                f.write(contents)
            
            # Возвращаем URL для доступа через media proxy
            file_url = f"/api/media/images/{date_folder}/{filename}"
            
            results.append({
                "success": True,
                "url": file_url,
                "filename": filename,
                "original_name": file.filename,
                "size": len(contents)
            })
            
        except Exception as e:
            errors.append({
                "filename": file.filename if file.filename else "unknown",
                "error": str(e)
            })
    
    return {
        "success": len(results) > 0,
        "uploaded": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors if errors else None
    }

