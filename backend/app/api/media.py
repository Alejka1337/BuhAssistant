"""
API для проксирования медиа-файлов (обход ngrok warning)
"""
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
import os
from typing import Iterator

router = APIRouter(prefix="/media", tags=["media"])

# Используем путь на хосте через монтированный volume
import os
if os.path.exists("/app/app"):  # Мы в Docker
    STATIC_DIR = Path("/app/static")
else:  # Локальная разработка
    STATIC_DIR = Path(__file__).parent.parent.parent / "static"


@router.get("/images/{year}/{month}/{filename}")
async def get_image(year: str, month: str, filename: str):
    """
    Проксирование изображений (обход ngrok warning и ORB)
    """
    print(f"🖼️ Media proxy: Requesting image: {year}/{month}/{filename}")
    file_path = STATIC_DIR / "uploads" / "images" / year / month / filename
    print(f"🔍 File path: {file_path}")
    print(f"📁 Exists: {file_path.exists()}")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверка безопасности
    try:
        file_path.resolve().relative_to(STATIC_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Читаем файл
    def iterfile():
        with open(file_path, mode="rb") as file_like:
            yield from file_like
    
    # Определяем MIME тип
    ext = file_path.suffix[1:].lower()
    mime_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
    }
    media_type = mime_types.get(ext, 'application/octet-stream')
    
    return StreamingResponse(
        iterfile(),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Cross-Origin-Embedder-Policy": "unsafe-none",
            "X-Content-Type-Options": "nosniff",
            "Timing-Allow-Origin": "*",
            "ngrok-skip-browser-warning": "true",
        }
    )


@router.get("/documents/{year}/{month}/{filename}")
async def get_document(year: str, month: str, filename: str):
    """
    Проксирование документов (обход ngrok warning и ORB)
    """
    file_path = STATIC_DIR / "uploads" / "documents" / year / month / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверка безопасности
    try:
        file_path.resolve().relative_to(STATIC_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Читаем файл
    def iterfile():
        with open(file_path, mode="rb") as file_like:
            yield from file_like
    
    # Определяем MIME тип
    ext = file_path.suffix[1:].lower()
    mime_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    media_type = mime_types.get(ext, 'application/octet-stream')
    
    return StreamingResponse(
        iterfile(),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Cross-Origin-Embedder-Policy": "unsafe-none",
            "X-Content-Type-Options": "nosniff",
            "Timing-Allow-Origin": "*",
            "ngrok-skip-browser-warning": "true",
        }
    )

