"""
Celery tasks для отправки push-уведомлений
"""
from celery import shared_task
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json
import os
import logging

from app.db.database import SessionLocal
from app.models.user import User, UserType
from app.models.news import News
from app.services.push_notification import push_service
from app.services.news_personalization import news_personalization_service

logger = logging.getLogger(__name__)


def get_all_calendar_data() -> List[Dict[str, Any]]:
    """
    Получить все данные календаря из all.json
    
    Returns:
        Список всех событий календаря
    """
    try:
        # Путь к файлу all.json
        calendar_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data",
            "calendar",
            "all.json"
        )
        
        if not os.path.exists(calendar_file):
            logger.warning(f"Calendar file not found: {calendar_file}")
            return []
        
        with open(calendar_file, "r", encoding="utf-8") as f:
            return json.load(f)
            
    except Exception as e:
        logger.error(f"Error loading calendar data: {e}")
        return []


@shared_task(name="send_deadline_notifications")
def send_deadline_notifications():
    """
    Отправить уведомления о приближающихся дедлайнах
    Запускается каждый день в 9:00
    """
    logger.info("Starting deadline notifications task")
    
    db = SessionLocal()
    try:
        # Получаем текущую дату
        today = datetime.now().date()
        
        # Получаем даты для проверки (через 1 и 3 дня)
        dates_to_check = {
            1: today + timedelta(days=1),
            3: today + timedelta(days=3)
        }
        
        # Загружаем все данные календаря из all.json
        all_calendar_data = get_all_calendar_data()
        
        # Ищем события на нужные даты
        notifications_to_send = {}
        
        for days_before, check_date in dates_to_check.items():
            # Ищем события на эту дату
            for event in all_calendar_data:
                try:
                    # Парсим дату - поддерживаем оба формата: DD.MM.YY и DD.MM.YYYY
                    event_date_str = event["date"]
                    try:
                        event_date = datetime.strptime(event_date_str, "%d.%m.%y").date()
                    except ValueError:
                        event_date = datetime.strptime(event_date_str, "%d.%m.%Y").date()
                    
                    if event_date == check_date:
                        # event - это уже сам отчет
                        notifications_to_send[days_before] = {
                            "date": check_date,
                            "report": event,
                            "days_before": days_before
                        }
                        break
                except (ValueError, KeyError) as e:
                    logger.warning(f"Error parsing event date: {event.get('date')}, error: {e}")
                    continue
        
        if not notifications_to_send:
            logger.info("No deadlines found for upcoming days")
            return {"status": "success", "notifications_sent": 0}
        
        # Получаем пользователей с включенными уведомлениями о дедлайнах
        users = db.query(User).filter(
            User.is_active == True,
            User.is_verified == True,
            User.push_token.isnot(None)
        ).all()
        
        total_sent = 0
        
        for user in users:
            # Проверяем настройки пользователя
            if not user.notification_settings:
                continue
            
            settings = user.notification_settings
            if not settings.enable_deadline_notifications:
                continue
            
            # Проверяем, за сколько дней пользователь хочет получать уведомления
            days_before_list = settings.deadline_days_before or [1, 3]
            
            for days_before, notif_data in notifications_to_send.items():
                if days_before not in days_before_list:
                    continue
                
                # Формируем текст уведомления
                report_name = notif_data["report"].get("title", "Звіт")
                deadline_date = notif_data["date"].strftime("%d.%m.%Y")
                
                if days_before == 1:
                    days_text = "завтра"
                else:
                    days_text = f"через {days_before} дні" if days_before < 5 else f"через {days_before} днів"
                
                title = f"⏰ Нагадування про дедлайн"
                body = f"{report_name} - {days_text} ({deadline_date})"
                
                # Отправляем уведомление
                result = push_service.send_push_notification(
                    push_token=user.push_token,
                    title=title,
                    body=body,
                    data={
                        "type": "deadline",
                        "report": notif_data["report"],
                        "date": deadline_date,
                        "days_before": days_before
                    }
                )
                
                if result["success"]:
                    total_sent += 1
                    logger.info(f"Deadline notification sent to user {user.id}")
                else:
                    logger.error(f"Failed to send notification to user {user.id}: {result.get('error')}")
                    
                    # Если токен устарел, удаляем его
                    if result.get("should_remove_token"):
                        user.push_token = None
                        db.commit()
        
        logger.info(f"Deadline notifications task completed. Sent: {total_sent}")
        return {"status": "success", "notifications_sent": total_sent}
        
    except Exception as e:
        logger.error(f"Error in deadline notifications task: {e}")
        return {"status": "error", "error": str(e)}
        
    finally:
        db.close()


@shared_task(name="send_news_notifications")
def send_news_notifications():
    """
    Отправить персонализированные уведомления о новостях
    Запускается 2 раза в неделю (понедельник и четверг в 10:00)
    """
    logger.info("Starting news notifications task")
    
    db = SessionLocal()
    try:
        # Получаем новости за последнюю неделю
        week_ago = datetime.now() - timedelta(days=7)
        
        recent_news = db.query(News).filter(
            News.published_at >= week_ago
        ).order_by(News.published_at.desc()).limit(50).all()
        
        if not recent_news:
            logger.info("No recent news found")
            return {"status": "success", "notifications_sent": 0}
        
        # Получаем активных пользователей с включенными уведомлениями о новостях
        users = db.query(User).filter(
            User.is_active == True,
            User.is_verified == True,
            User.push_token.isnot(None)
        ).all()
        
        total_sent = 0
        
        for user in users:
            # Проверяем настройки пользователя
            if not user.notification_settings:
                continue
            
            settings = user.notification_settings
            if not settings.enable_news_notifications:
                continue
            
            # Фильтруем новости по целевой аудитории
            filtered_news = news_personalization_service.filter_news_by_target_audience(
                recent_news,
                user.user_type
            )
            
            if not filtered_news:
                logger.info(f"No relevant news for user {user.id}")
                continue
            
            # Используем OpenAI для выбора наиболее релевантной новости
            selected_news = news_personalization_service.select_best_news_for_user(
                news_list=filtered_news,
                user_type=user.user_type,
                fop_group=user.fop_group,
                tax_system=user.tax_system,
                limit=1
            )
            
            if not selected_news:
                logger.info(f"No news selected for user {user.id}")
                continue
            
            news_item = selected_news[0]
            
            # Формируем уведомление
            title = "📰 Нова стаття для вас"
            body = f"{news_item.title}"
            
            # Отправляем
            result = push_service.send_push_notification(
                push_token=user.push_token,
                title=title,
                body=body,
                data={
                    "type": "news",
                    "news_id": news_item.id,
                    "news_url": news_item.url,
                    "source": news_item.source
                }
            )
            
            if result["success"]:
                total_sent += 1
                logger.info(f"News notification sent to user {user.id}: {news_item.title}")
            else:
                logger.error(f"Failed to send notification to user {user.id}: {result.get('error')}")
                
                # Если токен устарел, удаляем его
                if result.get("should_remove_token"):
                    user.push_token = None
                    db.commit()
        
        logger.info(f"News notifications task completed. Sent: {total_sent}")
        return {"status": "success", "notifications_sent": total_sent}
        
    except Exception as e:
        logger.error(f"Error in news notifications task: {e}")
        return {"status": "error", "error": str(e)}
        
    finally:
        db.close()

