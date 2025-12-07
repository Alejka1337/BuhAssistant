"""
API endpoints для жалоб на контент
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import logging

from app.db.database import get_db
from app.models.user import User
from app.models.report import ContentReport
from app.models.forum import ForumThread, ForumPost
from app.schemas.report import ContentReportCreate, ContentReportResponse
from app.api.deps import get_current_user
from app.core.deps import get_current_moderator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("", response_model=ContentReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ContentReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создать жалобу на контент (топик или комментарий)
    
    Требует авторизации. Пользователь не может пожаловаться на свой собственный контент.
    """
    # Проверяем, что пользователь не жалуется сам на себя
    if report_data.reported_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report your own content"
        )
    
    # Проверяем, что пользователь еще не жаловался на этот контент
    existing_report = db.query(ContentReport).filter(
        ContentReport.reporter_id == current_user.id,
        ContentReport.content_type == report_data.content_type,
        ContentReport.content_id == report_data.content_id
    ).first()
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reported this content"
        )
    
    # Создаём жалобу
    new_report = ContentReport(
        reporter_id=current_user.id,
        reported_user_id=report_data.reported_user_id,
        content_type=report_data.content_type,
        content_id=report_data.content_id,
        reason=report_data.reason,
        details=report_data.details,
        status="pending"
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    logger.info(f"User {current_user.id} reported {report_data.content_type} {report_data.content_id} (reason: {report_data.reason})")
    
    return new_report


@router.get("/my", response_model=List[ContentReportResponse])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список моих жалоб
    
    Требует авторизации. Возвращает все жалобы, поданные текущим пользователем.
    """
    reports = db.query(ContentReport).filter(
        ContentReport.reporter_id == current_user.id
    ).order_by(ContentReport.created_at.desc()).all()
    
    return reports


# ===== Endpoints для модераторов =====

@router.get("", response_model=List[ContentReportResponse])
def get_all_reports(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, reviewed, dismissed"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Получить список всех жалоб (только для модераторов)
    
    Требует роль moderator или admin.
    """
    query = db.query(ContentReport)
    
    if status_filter:
        query = query.filter(ContentReport.status == status_filter)
    
    reports = query.order_by(ContentReport.created_at.desc()).offset(offset).limit(limit).all()
    
    return reports


@router.patch("/{report_id}/review", response_model=ContentReportResponse)
def review_report(
    report_id: int,
    action: str = Query(..., description="Action to take: dismiss or accept"),
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Обработать жалобу (только для модераторов)
    
    Actions:
    - dismiss: отклонить жалобу (контент остаётся)
    - accept: принять жалобу (контент будет удалён вручную)
    """
    report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    if action not in ["dismiss", "accept"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'dismiss' or 'accept'"
        )
    
    if action == "dismiss":
        report.status = "dismissed"
    else:
        report.status = "reviewed"
    
    report.reviewed_at = datetime.now(timezone.utc)
    report.reviewed_by_id = moderator.id
    
    db.commit()
    db.refresh(report)
    
    logger.info(f"Moderator {moderator.id} {action}ed report {report_id}")
    
    return report


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Удалить жалобу (только для модераторов)
    """
    report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    db.delete(report)
    db.commit()
    
    logger.info(f"Moderator {moderator.id} deleted report {report_id}")
    
    return {"status": "deleted"}

