"""
Сервис для фильтрации новостей через OpenAI API
"""
import openai
from typing import List, Dict
from app.core.config import settings


async def filter_relevant_news(articles: List[Dict]) -> List[Dict]:
    """
    Фильтрация новостей через OpenAI API
    
    Args:
        articles: Список статей с полями title, url, source
    
    Returns:
        Список релевантных статей с добавленными полями:
        - is_relevant: bool
        - target_audience: List[str] (ФОП, ЮО, бухгалтери)
        - category: str (податки, звітність, законодавство, тощо)
        - summary: str (короткий опис)
    """
    api_key = settings.OPENAI_API_KEY
    
    if not api_key:
        print("⚠️ OpenAI API Key not configured, skipping filtering")
        # Возвращаем все статьи как релевантные
        return [
            {
                **article,
                'is_relevant': True,
                'target_audience': ['ФОП', 'ЮО', 'бухгалтери'],
                'category': 'загальне',
                'summary': article['title']
            }
            for article in articles
        ]
    
    # Формируем запрос для OpenAI
    articles_text = "\n".join([
        f"{i+1}. {article['title']}"
        for i, article in enumerate(articles)
    ])
    
    prompt = f"""Ти - експерт з бухгалтерського обліку та оподаткування в Україні.

Проаналізуй наступні новини та визнач, які з них будуть корисні для нашої аудиторії:
- ФОП (фізичні особи-підприємці)
- ЮО (юридичні особи)
- Бухгалтери

НОВИНИ:
{articles_text}

Для КОЖНОЇ новини поверни JSON об'єкт з наступними полями:
- number: номер новини (1, 2, 3...)
- is_relevant: true/false (чи релевантна новина для нашої аудиторії)
- target_audience: масив ["ФОП", "ЮО", "бухгалтери"] (для кого релевантна)
- category: одна з категорій (податки, звітність, законодавство, ЄСВ, зарплата, бухоблік, інше)
- summary: короткий опис (1-2 речення) чому ця новина важлива

ВАЖЛИВО: Релевантними вважаються новини про:
- Зміни в податковому законодавстві
- Нові звіти та терміни подання
- Зміни ставок податків, ЄСВ, мінімальної зарплати
- Бухгалтерський облік та фінансова звітність
- Штрафи та санкції
- Практичні поради для бухгалтерів та підприємців

НЕ релевантними є новини про:
- Макроекономічні показники без практичного застосування
- Політичні новини
- Банківські акції та кредити
- Загальні новини без зв'язку з обліком

Поверни масив JSON об'єктів, по одному для кожної новини."""

    try:
        client = openai.AsyncOpenAI(api_key=api_key)
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Более дешевая модель
            messages=[
                {
                    "role": "system",
                    "content": "Ти - експерт з бухгалтерського обліку та оподаткування в Україні. Відповідай тільки у форматі JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Парсим ответ
        import json
        result_text = response.choices[0].message.content
        
        # OpenAI может обернуть в объект с ключом "news" или "results"
        parsed = json.loads(result_text)
        
        # Находим массив с результатами
        if 'news' in parsed:
            filtered_results = parsed['news']
        elif 'results' in parsed:
            filtered_results = parsed['results']
        elif isinstance(parsed, list):
            filtered_results = parsed
        else:
            # Если это объект, пытаемся найти первое поле-массив
            for value in parsed.values():
                if isinstance(value, list):
                    filtered_results = value
                    break
            else:
                filtered_results = []
        
        # Объединяем оригинальные статьи с результатами фильтрации
        enriched_articles = []
        for article in articles:
            # Ищем соответствующий результат по номеру
            article_number = articles.index(article) + 1
            filter_result = next(
                (r for r in filtered_results if r.get('number') == article_number),
                None
            )
            
            if filter_result:
                enriched_article = {
                    **article,
                    'is_relevant': filter_result.get('is_relevant', False),
                    'target_audience': filter_result.get('target_audience', []),
                    'category': filter_result.get('category', 'інше'),
                    'summary': filter_result.get('summary', article['title'])
                }
            else:
                # Если не нашли, считаем нерелевантной
                enriched_article = {
                    **article,
                    'is_relevant': False,
                    'target_audience': [],
                    'category': 'інше',
                    'summary': article['title']
                }
            
            enriched_articles.append(enriched_article)
        
        # Фильтруем только релевантные
        relevant_articles = [a for a in enriched_articles if a['is_relevant']]
        
        print(f"✅ OpenAI filtered: {len(relevant_articles)}/{len(articles)} relevant articles")
        return relevant_articles
        
    except Exception as e:
        print(f"❌ OpenAI filtering error: {e}")
        import traceback
        traceback.print_exc()
        
        # В случае ошибки возвращаем все статьи
        return [
            {
                **article,
                'is_relevant': True,
                'target_audience': ['ФОП', 'ЮО', 'бухгалтери'],
                'category': 'загальне',
                'summary': article['title']
            }
            for article in articles
        ]

