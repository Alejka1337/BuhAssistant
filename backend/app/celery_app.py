"""
Celery application configuration
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

# Создание Celery app
celery_app = Celery(
    "buhassistant",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.tasks.crawler_tasks', 'app.tasks.notification_tasks']
)

# Конфигурация Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Kyiv',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=4 * 60 * 60,  # 4 часа максимум на задачу (для задач с рандомной задержкой до 2 часов)
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Настройка периодических задач (Celery Beat)
celery_app.conf.beat_schedule = {
    # Парсинг ВСЕХ новостей 2 раза в день: в 8:00 и 20:00 (Киев)
    'crawl-all-news-twice-daily': {
        'task': 'crawl_all_news_sources_task',
        'schedule': crontab(minute=0, hour='8,20'),  # 8:00 и 20:00
        'options': {'queue': 'crawler'}
    },
    
    # Push-уведомления о дедлайнах: каждый день в 9:00 (Киев)
    'send-deadline-notifications-daily': {
        'task': 'send_deadline_notifications',
        'schedule': crontab(minute=0, hour=9),  # 9:00 каждый день
        'options': {'queue': 'notifications'}
    },
    
    # Push-уведомления о новостях: каждый день 2 раза (12:00-14:00 и 18:00-20:00) (Киев)
    'send-news-notifications-noon': {
        'task': 'send_news_notifications',
        'schedule': crontab(minute=0, hour=12),  # 12:00 каждый день, рандомная задержка 0-120 мин
        'options': {'queue': 'notifications'}
    },
    'send-news-notifications-evening': {
        'task': 'send_news_notifications',
        'schedule': crontab(minute=0, hour=18),  # 18:00 каждый день, рандомная задержка 0-120 мин
        'options': {'queue': 'notifications'}
    },
    
    # Тестовая задача (можно отключить в продакшене)
    # 'test-celery-every-5-minutes': {
    #     'task': 'test_celery_task',
    #     'schedule': crontab(minute='*/5'),
    #     'options': {'queue': 'default'}
    # },
}

# Настройка очередей
celery_app.conf.task_routes = {
    'crawl_minfin_news_task': {'queue': 'crawler'},
    'crawl_liga_net_news_task': {'queue': 'crawler'},
    'crawl_buhgalter911_news_task': {'queue': 'crawler'},
    'crawl_tax_gov_ua_playwright_task': {'queue': 'crawler'},
    'crawl_diia_gov_ua_playwright_task': {'queue': 'crawler'},
    'crawl_dtkt_task': {'queue': 'crawler'},
    'crawl_buhplatforma_task': {'queue': 'crawler'},
    'crawl_7eminar_task': {'queue': 'crawler'},
    'crawl_all_news_sources_task': {'queue': 'crawler'},
    'send_deadline_notifications': {'queue': 'notifications'},
    'send_news_notifications': {'queue': 'notifications'},
    'test_celery_task': {'queue': 'default'},
}

if __name__ == '__main__':
    celery_app.start()

