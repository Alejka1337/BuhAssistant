"""
Сервис для работы с push-уведомлениями через Expo Push Notification Service
"""
from typing import List, Dict, Optional, Any
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from requests.exceptions import ConnectionError, HTTPError
import logging

logger = logging.getLogger(__name__)


class PushNotificationService:
    """Сервис для отправки push-уведомлений через Expo"""
    
    def __init__(self):
        self.client = PushClient()
    
    def send_push_notification(
        self,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        sound: str = "default",
        badge: Optional[int] = None,
        priority: str = "default"
    ) -> Dict[str, Any]:
        """
        Отправить push-уведомление на один токен
        
        Args:
            push_token: Expo push token
            title: Заголовок уведомления
            body: Текст уведомления
            data: Дополнительные данные (будут доступны в приложении)
            sound: Звук уведомления ("default" или None)
            badge: Число для badge на иконке приложения
            priority: Приоритет ("default", "normal", "high")
        
        Returns:
            Dict с результатом отправки
        """
        try:
            # Проверяем валидность токена
            if not PushClient.is_exponent_push_token(push_token):
                logger.error(f"Invalid push token format: {push_token}")
                return {
                    "success": False,
                    "error": "Invalid push token format",
                    "push_token": push_token
                }
            
            # Создаем сообщение
            message = PushMessage(
                to=push_token,
                title=title,
                body=body,
                data=data or {},
                sound=sound,
                badge=badge,
                priority=priority
            )
            
            # Отправляем
            response = self.client.publish(message)
            
            # Обрабатываем ответ
            if response.is_success():
                logger.info(f"Push notification sent successfully to {push_token}")
                return {
                    "success": True,
                    "push_token": push_token,
                    "ticket_id": response.id
                }
            else:
                logger.error(f"Push notification failed: {response.message}")
                return {
                    "success": False,
                    "error": response.message,
                    "push_token": push_token
                }
                
        except DeviceNotRegisteredError:
            logger.warning(f"Device not registered: {push_token}")
            return {
                "success": False,
                "error": "Device not registered",
                "push_token": push_token,
                "should_remove_token": True  # Токен устарел, нужно удалить из БД
            }
            
        except PushServerError as e:
            logger.error(f"Expo push server error: {e}")
            return {
                "success": False,
                "error": f"Push server error: {str(e)}",
                "push_token": push_token
            }
            
        except (ConnectionError, HTTPError) as e:
            logger.error(f"Network error sending push: {e}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "push_token": push_token
            }
            
        except Exception as e:
            logger.error(f"Unexpected error sending push: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "push_token": push_token
            }
    
    def send_push_notifications_batch(
        self,
        notifications: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Отправить несколько push-уведомлений batch-ом
        
        Args:
            notifications: Список уведомлений в формате:
                [
                    {
                        "push_token": "ExponentPushToken[xxx]",
                        "title": "Title",
                        "body": "Body",
                        "data": {...}
                    },
                    ...
                ]
        
        Returns:
            Список результатов для каждого уведомления
        """
        results = []
        
        # Создаем сообщения
        messages = []
        for notif in notifications:
            push_token = notif.get("push_token")
            
            # Проверяем валидность токена
            if not PushClient.is_exponent_push_token(push_token):
                logger.error(f"Invalid push token format: {push_token}")
                results.append({
                    "success": False,
                    "error": "Invalid push token format",
                    "push_token": push_token
                })
                continue
            
            message = PushMessage(
                to=push_token,
                title=notif.get("title", ""),
                body=notif.get("body", ""),
                data=notif.get("data", {}),
                sound=notif.get("sound", "default"),
                badge=notif.get("badge"),
                priority=notif.get("priority", "default")
            )
            messages.append((message, push_token))
        
        # Отправляем batch
        try:
            if messages:
                responses = self.client.publish_multiple([msg for msg, _ in messages])
                
                # Обрабатываем ответы
                for (message, push_token), response in zip(messages, responses):
                    if response.is_success():
                        logger.info(f"Push notification sent successfully to {push_token}")
                        results.append({
                            "success": True,
                            "push_token": push_token,
                            "ticket_id": response.id
                        })
                    else:
                        logger.error(f"Push notification failed for {push_token}: {response.message}")
                        results.append({
                            "success": False,
                            "error": response.message,
                            "push_token": push_token
                        })
        except Exception as e:
            logger.error(f"Error sending batch push notifications: {e}")
            # Добавляем ошибки для оставшихся сообщений
            for message, push_token in messages:
                results.append({
                    "success": False,
                    "error": str(e),
                    "push_token": push_token
                })
        
        return results
    
    def send_to_users(
        self,
        user_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Отправить уведомление списку пользователей
        
        Args:
            user_tokens: Список push токенов
            title: Заголовок
            body: Текст
            data: Дополнительные данные
        
        Returns:
            Статистика отправки
        """
        notifications = [
            {
                "push_token": token,
                "title": title,
                "body": body,
                "data": data or {}
            }
            for token in user_tokens
        ]
        
        results = self.send_push_notifications_batch(notifications)
        
        # Собираем статистику
        success_count = sum(1 for r in results if r.get("success"))
        failed_count = len(results) - success_count
        tokens_to_remove = [r["push_token"] for r in results if r.get("should_remove_token")]
        
        return {
            "total": len(results),
            "success": success_count,
            "failed": failed_count,
            "tokens_to_remove": tokens_to_remove,
            "results": results
        }


# Singleton instance
push_service = PushNotificationService()

