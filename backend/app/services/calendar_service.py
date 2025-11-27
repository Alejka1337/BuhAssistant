"""
Сервис для работы с календарем бухгалтерских отчетов
"""
import json
import os
from pathlib import Path
from typing import List, Optional
from app.schemas.calendar import CalendarEvent, AvailablePeriod
import logging

logger = logging.getLogger(__name__)

# Путь к директории с календарными данными
CALENDAR_DATA_DIR = Path(__file__).parent.parent.parent / "data" / "calendar"


class CalendarService:
    """Сервис для получения календарных событий"""

    @staticmethod
    def get_all_calendar_events() -> List[CalendarEvent]:
        """
        Загрузить все события календаря из all.json
            
        Returns:
            Список всех событий календаря
            
        Raises:
            FileNotFoundError: Если файл календаря не найден
            ValueError: Если файл поврежден или содержит неверные данные
        """
        filename = "all.json"
        filepath = CALENDAR_DATA_DIR / filename
        
        if not filepath.exists():
            logger.warning(f"Calendar file not found: {filepath}")
            raise FileNotFoundError(f"Файл календаря all.json не знайдено")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Валидация и преобразование в Pydantic модели
            events = [CalendarEvent(**event) for event in data]
            logger.info(f"Loaded {len(events)} events from {filename}")
            return events
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {filename}: {e}")
            raise ValueError(f"Помилка читання файлу календаря: неправильний формат")
        except Exception as e:
            logger.error(f"Error loading calendar {filename}: {e}")
            raise ValueError(f"Помилка завантаження календаря: {str(e)}")

    @staticmethod
    def get_available_periods() -> List[AvailablePeriod]:
        """
        Получить список доступных периодов (месяцев/годов) в календаре
        
        Returns:
            Список доступных периодов, отсортированный по дате
        """
        if not CALENDAR_DATA_DIR.exists():
            logger.warning(f"Calendar data directory not found: {CALENDAR_DATA_DIR}")
            return []
        
        periods = []
        
        # Сканируем директорию на наличие файлов формата MM_YYYY.json
        for filepath in CALENDAR_DATA_DIR.glob("*.json"):
            try:
                # Парсим имя файла: "10_2025.json" -> month=10, year=2025
                filename = filepath.stem  # Убираем .json
                parts = filename.split('_')
                
                if len(parts) == 2:
                    month = int(parts[0])
                    year = int(parts[1])
                    
                    # Валидация
                    if 1 <= month <= 12 and 2020 <= year <= 2100:
                        periods.append(AvailablePeriod(month=month, year=year))
                    else:
                        logger.warning(f"Invalid period in filename: {filename}")
                        
            except (ValueError, IndexError) as e:
                logger.warning(f"Could not parse calendar filename {filepath.name}: {e}")
                continue
        
        # Сортируем по году и месяцу
        periods.sort(key=lambda p: (p.year, p.month))
        
        logger.info(f"Found {len(periods)} available calendar periods")
        return periods

    @staticmethod
    def validate_calendar_data(data: List[dict]) -> bool:
        """
        Валидировать структуру календарных данных
        
        Args:
            data: Список словарей с событиями
            
        Returns:
            True если данные валидны
            
        Raises:
            ValueError: Если данные не валидны
        """
        try:
            # Пытаемся создать Pydantic модели
            events = [CalendarEvent(**event) for event in data]
            return True
        except Exception as e:
            raise ValueError(f"Невалідні дані календаря: {str(e)}")


# Экземпляр сервиса для использования
calendar_service = CalendarService()

