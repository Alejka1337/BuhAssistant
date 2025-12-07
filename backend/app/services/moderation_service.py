"""
Сервис AI-модерации контента через OpenAI Moderation API
"""
from openai import AsyncOpenAI
from typing import Dict, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Инициализация OpenAI клиента
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class ModerationResult:
    """Результат модерации контента"""
    
    def __init__(
        self,
        approved: bool,
        reason: Optional[str] = None,
        categories: Optional[Dict] = None,
        raw_response: Optional[Dict] = None
    ):
        self.approved = approved
        self.reason = reason
        self.categories = categories
        self.raw_response = raw_response
    
    def to_dict(self) -> Dict:
        return {
            'approved': self.approved,
            'reason': self.reason,
            'categories': self.categories,
            'raw_response': self.raw_response
        }


async def check_content_with_ai(text: str) -> ModerationResult:
    """
    Проверка контента через OpenAI Moderation API
    
    Args:
        text: Текст для проверки
    
    Returns:
        ModerationResult с решением модерации
    
    Raises:
        Exception: Если произошла ошибка при обращении к API
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("⚠️ OPENAI_API_KEY not configured, skipping moderation")
        return ModerationResult(approved=True, reason="Moderation disabled")
    
    if not text or not text.strip():
        logger.warning("⚠️ Empty text provided for moderation")
        return ModerationResult(
            approved=False,
            reason="Текст не може бути порожнім"
        )
    
    try:
        logger.info(f"🤖 Checking content with OpenAI Moderation API (length: {len(text)})")
        
        # Вызов OpenAI Moderation API
        response = await client.moderations.create(
            model="omni-moderation-latest",
            input=text
        )
        
        # Получаем результат модерации
        result = response.results[0]
        
        # Логируем результат
        logger.info(f"📊 Moderation result: flagged={result.flagged}")
        
        if result.flagged:
            # Контент нарушает правила
            # Определяем наиболее вероятную категорию нарушения
            flagged_categories = []
            
            # Проверяем категории нарушений
            category_scores = result.category_scores.model_dump()
            
            # Пороговые значения для категорий
            HIGH_THRESHOLD = 0.7  # Высокая уверенность
            MEDIUM_THRESHOLD = 0.3  # Средняя уверенность
            
            category_names = {
                'sexual': 'сексуальний контент',
                'hate': 'мова ненависті',
                'harassment': 'домагання',
                'self_harm': 'самопошкодження',
                'sexual_minors': 'сексуальний контент з неповнолітніми',
                'hate_threatening': 'погрози на фоні ненависті',
                'violence_graphic': 'графічне насильство',
                'self_harm_intent': 'наміри самопошкодження',
                'self_harm_instructions': 'інструкції з самопошкодження',
                'harassment_threatening': 'погрози та домагання',
                'violence': 'насильство',
                'illicit': 'незаконна діяльність',
                'illicit_violent': 'насильницька незаконна діяльність',
            }
            
            for category, score in category_scores.items():
                if score >= HIGH_THRESHOLD:
                    flagged_categories.append(f"{category_names.get(category, category)} (висока ймовірність)")
                elif score >= MEDIUM_THRESHOLD:
                    flagged_categories.append(f"{category_names.get(category, category)} (середня ймовірність)")
            
            reason = "Контент порушує правила спільноти"
            if flagged_categories:
                reason += ": " + ", ".join(flagged_categories[:3])  # Топ-3 категорії
            
            logger.warning(f"⛔ Content rejected: {reason}")
            
            return ModerationResult(
                approved=False,
                reason=reason,
                categories=result.categories.model_dump(),
                raw_response=result.model_dump()
            )
        else:
            # Контент прошел проверку
            logger.info("✅ Content approved by moderation")
            
            return ModerationResult(
                approved=True,
                reason=None,
                categories=result.categories.model_dump(),
                raw_response=result.model_dump()
            )
        
    except Exception as e:
        logger.error(f"❌ Error during moderation: {e}")
        import traceback
        traceback.print_exc()
        
        # В случае ошибки API - НЕ блокируем контент
        # (чтобы не нарушать работу форума при проблемах с OpenAI)
        return ModerationResult(
            approved=True,
            reason=f"Moderation API error (fallback to approve): {str(e)}"
        )


async def check_spam_with_gpt(text: str) -> ModerationResult:
    """
    Дополнительная проверка контента на спам, рекламу и нерелевантность через GPT-4 Mini
    
    Args:
        text: Текст для проверки
    
    Returns:
        ModerationResult с решением модерации
    """
    if not settings.OPENAI_API_KEY:
        return ModerationResult(approved=True, reason="Spam check disabled")
    
    try:
        logger.info(f"🔍 Checking content for spam with GPT-4 Mini")
        
        # Промпт для определения спама и неподходящего контента
        system_prompt = """Ты - модератор бухгалтерського форуму для українських бухгалтерів. 
Твоя задача - визначити, чи відповідає контент тематиці форуму та чи не є він спамом.

БЛОКУЙ контент, якщо він містить:
1. Рекламу товарів або послуг (кредити, позики, товари, послуги не пов'язані з бухгалтерією)
2. Спам або флуд
3. Посилання на сторонні сайти (крім офіційних урядових)
4. Агресивний маркетинг з великими літерами та знаками оклику
5. Контент не пов'язаний з бухгалтерією, податками, звітністю

ДОЗВОЛЯЙ контент, якщо він:
1. Пов'язаний з бухгалтерією, податками, звітністю
2. Містить питання або відповіді про бухгалтерські процеси
3. Обговорює законодавчі зміни в Україні
4. Ділиться досвідом роботи бухгалтером

Відповідай ТІЛЬКИ у форматі JSON:
{"block": true/false, "reason": "коротка причина українською"}"""

        user_prompt = f"Контент для перевірки:\n\n{text}"
        
        # Вызов GPT-4 Mini
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=150,
            response_format={"type": "json_object"}
        )
        
        # Парсим ответ
        result_text = response.choices[0].message.content
        import json
        result_json = json.loads(result_text)
        
        should_block = result_json.get('block', False)
        reason = result_json.get('reason', 'Контент не відповідає тематиці форуму')
        
        if should_block:
            logger.warning(f"⛔ Content blocked by GPT spam check: {reason}")
            return ModerationResult(
                approved=False,
                reason=reason,
                raw_response=result_json
            )
        else:
            logger.info("✅ Content approved by GPT spam check")
            return ModerationResult(
                approved=True,
                reason=None,
                raw_response=result_json
            )
        
    except Exception as e:
        logger.error(f"❌ Error during GPT spam check: {e}")
        import traceback
        traceback.print_exc()
        
        # В случае ошибки - НЕ блокируем контент
        return ModerationResult(
            approved=True,
            reason=f"Spam check API error (fallback to approve): {str(e)}"
        )


async def check_forum_content(title: str, content: Optional[str] = None) -> ModerationResult:
    """
    Двухэтапная проверка контента форума:
    1. OpenAI Moderation API - для явных нарушений (бесплатно)
    2. GPT-4 Mini - для спама и нерелевантности (платно, но дешево)
    
    Args:
        title: Заголовок темы или поста
        content: Текст контента (опционально)
    
    Returns:
        ModerationResult с решением модерации
    """
    # Объединяем заголовок и контент для проверки
    text_to_check = title
    if content:
        text_to_check += "\n\n" + content
    
    # Этап 1: Базовая модерация (явные нарушения)
    basic_result = await check_content_with_ai(text_to_check)
    if not basic_result.approved:
        logger.warning(f"⛔ Content rejected at stage 1 (basic moderation)")
        return basic_result
    
    # Этап 2: Проверка на спам и релевантность
    spam_result = await check_spam_with_gpt(text_to_check)
    if not spam_result.approved:
        logger.warning(f"⛔ Content rejected at stage 2 (spam check)")
        return spam_result
    
    logger.info(f"✅ Content approved (passed both stages)")
    return spam_result


# Для тестирования
if __name__ == "__main__":
    import asyncio
    
    async def test():
        # Тест 1: Нормальный контент
        print("\n=== Test 1: Normal content ===")
        result1 = await check_forum_content(
            title="Як розрахувати ЄСВ для ФОП?",
            content="Доброго дня! Підкажіть, будь ласка, як правильно розрахувати ЄСВ для ФОП на загальній системі?"
        )
        print(f"Approved: {result1.approved}")
        print(f"Reason: {result1.reason}")
        
        # Тест 2: Спам
        print("\n=== Test 2: Spam content ===")
        result2 = await check_forum_content(
            title="ДЕШЕВЫЕ КРЕДИТЫ БЕЗ ПРОВЕРОК!!!",
            content="Деньги в долг всем! Переходи по ссылке: http://spam-site.com"
        )
        print(f"Approved: {result2.approved}")
        print(f"Reason: {result2.reason}")
        
        # Тест 3: Пустой контент
        print("\n=== Test 3: Empty content ===")
        result3 = await check_forum_content(title="", content="")
        print(f"Approved: {result3.approved}")
        print(f"Reason: {result3.reason}")
    
    asyncio.run(test())

