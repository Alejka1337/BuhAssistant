"""
Сервис персонализации новостей с использованием OpenAI
"""
from typing import List, Dict, Optional, Any
from openai import OpenAI
from app.core.config import settings
from app.models.user import UserType, FOPGroup
from app.models.news import News
import logging
import json

logger = logging.getLogger(__name__)


class NewsPersonalizationService:
    """Сервис для выбора релевантных новостей для пользователя через OpenAI"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def _get_user_profile_description(
        self,
        user_type: Optional[UserType],
        fop_group: Optional[FOPGroup],
        tax_system: Optional[str]
    ) -> str:
        """Создать описание профиля пользователя для промпта"""
        
        type_descriptions = {
            UserType.FOP: "ФОП (фізична особа підприємець)",
            UserType.LEGAL_ENTITY: "юридична особа",
            UserType.ACCOUNTANT: "бухгалтер",
            UserType.INDIVIDUAL: "фізична особа"
        }
        
        parts = []
        
        if user_type:
            parts.append(type_descriptions.get(user_type, "користувач"))
            
            if user_type == UserType.FOP and fop_group:
                parts.append(f"група {fop_group.value}")
        
        if tax_system:
            parts.append(f"система оподаткування: {tax_system}")
        
        if not parts:
            return "загальний користувач"
        
        return ", ".join(parts)
    
    def select_best_news_for_user(
        self,
        news_list: List[News],
        user_type: Optional[UserType],
        fop_group: Optional[FOPGroup] = None,
        tax_system: Optional[str] = None,
        limit: int = 1
    ) -> List[News]:
        """
        Выбрать наиболее релевантную новость для пользователя через OpenAI
        
        Args:
            news_list: Список новостей для выбора
            user_type: Тип пользователя
            fop_group: Группа ФОП (если применимо)
            tax_system: Система налогообложения
            limit: Сколько новостей выбрать (по умолчанию 1)
        
        Returns:
            Список отобранных новостей
        """
        
        if not news_list:
            logger.warning("Empty news list provided")
            return []
        
        if not settings.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured, returning first news")
            return news_list[:limit]
        
        try:
            # Подготавливаем данные о новостях
            news_data = []
            for i, news in enumerate(news_list):
                news_info = {
                    "index": i,
                    "title": news.title,
                    "excerpt": (news.content[:200] + "...") if news.content else "",
                    "source": news.source,
                    "target_audience": news.target_audience or []
                }
                news_data.append(news_info)
            
            # Описание профиля пользователя
            user_profile = self._get_user_profile_description(user_type, fop_group, tax_system)
            
            # Создаем промпт
            prompt = f"""Ти — асистент для вибору найбільш релевантних новин для українських бухгалтерів та підприємців.

Профіль користувача: {user_profile}

Список новин (JSON):
{json.dumps(news_data, ensure_ascii=False, indent=2)}

Завдання: Вибери {limit} найбільш релевантну(і) новину(и) для цього користувача. 
Враховуй:
1. Тип користувача та його специфіку
2. Поле target_audience у новини
3. Актуальність теми для цієї категорії користувачів
4. Практичну цінність інформації

Поверни відповідь у форматі JSON:
{{
  "selected_indices": [індекси вибраних новин],
  "reason": "коротке пояснення вибору"
}}"""

            # Запрос к OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Используем более быструю и дешевую модель
                messages=[
                    {
                        "role": "system",
                        "content": "Ти — експерт з бухгалтерського обліку та оподаткування в Україні. Допомагаєш вибирати найбільш релевантні новини для користувачів."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            # Парсим ответ
            result = json.loads(response.choices[0].message.content)
            selected_indices = result.get("selected_indices", [])
            reason = result.get("reason", "")
            
            logger.info(f"OpenAI selected news indices: {selected_indices}. Reason: {reason}")
            
            # Возвращаем выбранные новости
            selected_news = [news_list[i] for i in selected_indices if 0 <= i < len(news_list)]
            
            return selected_news[:limit]
            
        except Exception as e:
            logger.error(f"Error selecting news with OpenAI: {e}")
            # Фолбек: возвращаем первые N новостей
            return news_list[:limit]
    
    def filter_news_by_target_audience(
        self,
        news_list: List[News],
        user_type: Optional[UserType]
    ) -> List[News]:
        """
        Простая фильтрация новостей по целевой аудитории
        
        Args:
            news_list: Список новостей
            user_type: Тип пользователя
        
        Returns:
            Отфильтрованный список новостей
        """
        
        if not user_type:
            return news_list
        
        # Маппинг типов пользователей на значения target_audience
        audience_mapping = {
            UserType.FOP: ["ФОП", "фоп"],
            UserType.LEGAL_ENTITY: ["ЮО", "юридичні особи", "юрособа"],
            UserType.ACCOUNTANT: ["бухгалтери", "бухгалтер"],
            UserType.INDIVIDUAL: []  # Физлица получают все новости
        }
        
        target_keywords = audience_mapping.get(user_type, [])
        
        if not target_keywords:
            return news_list
        
        # Фильтруем новости
        filtered = []
        for news in news_list:
            # Если у новости нет target_audience, она для всех
            if not news.target_audience:
                filtered.append(news)
                continue
            
            # Проверяем пересечение
            for keyword in target_keywords:
                if any(keyword.lower() in aud.lower() for aud in news.target_audience):
                    filtered.append(news)
                    break
        
        return filtered if filtered else news_list  # Если ничего не нашли, возвращаем все


# Singleton instance
news_personalization_service = NewsPersonalizationService()

