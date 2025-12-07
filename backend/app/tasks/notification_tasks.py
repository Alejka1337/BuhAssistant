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
import random
import time

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
    Отправить уведомления о новостях ВСЕМ пользователям (зарегистрированным + анонимным)
    Запускается 2 раза в день: в 12:00 и 18:00 (с рандомной задержкой 0-120 минут)
    """
    logger.info("Starting news notifications task")
    
    # РАНДОМНАЯ ЗАДЕРЖКА: 0-120 минут (0-7200 секунд)
    delay_seconds = random.randint(0, 7200)  # 2 часа = 7200 секунд
    delay_minutes = delay_seconds / 60
    
    logger.info(f"Applying random delay: {delay_minutes:.1f} minutes ({delay_seconds} seconds)")
    time.sleep(delay_seconds)
    
    logger.info(f"Delay completed. Sending news notifications now at {datetime.now()}")
    
    db = SessionLocal()
    try:
        # Получаем свежие новости за последние 24 часа
        day_ago = datetime.now() - timedelta(hours=24)
        
        recent_news = db.query(News).filter(
            News.published_at >= day_ago
        ).order_by(News.published_at.desc()).limit(10).all()
        
        if not recent_news:
            logger.info("No recent news found")
            return {"status": "success", "notifications_sent": 0}
        
        # Выбираем самую свежую новость
        news_item = recent_news[0]
        
        # Формируем уведомление
        title = "📰 Нова стаття"
        body = f"{news_item.title}"
        
        # Отправляем ВСЕМ (зарегистрированным + анонимным) через новый метод
        result = push_service.send_news_to_all(
            db=db,
            title=title,
            body=body,
            data={
                "type": "news",
                "news_id": news_item.id,
                "news_url": news_item.url,
                "source": news_item.source
            }
        )
        
        logger.info(
            f"News notifications task completed. "
            f"Sent: {result['success']}/{result['total']} "
            f"(Registered: {result['registered_users']}, Anonymous: {result['anonymous_users']})"
        )
        
        return {
            "status": "success",
            "notifications_sent": result['success'],
            "registered_users": result['registered_users'],
            "anonymous_users": result['anonymous_users'],
            "news_title": news_item.title,
            "delay_minutes": delay_minutes
        }
        
    except Exception as e:
        logger.error(f"Error in news notifications task: {e}")
        return {"status": "error", "error": str(e)}
        
    finally:
        db.close()

