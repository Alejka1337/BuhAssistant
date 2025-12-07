"""
Краулер для парсинга новостей и статей с сайта 7eminar.ua
Использует BeautifulSoup4 + aiohttp для парсинга
"""

import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime, timedelta
import logging
import re

logger = logging.getLogger(__name__)

# URL источника
EMINAR_NEWS_URL = "https://7eminar.ua/news?type=all"
SOURCE_NAME = "7eminar.ua"


async def crawl_7eminar() -> List[Dict]:
    """
    Парсинг новостей и статей с 7eminar.ua
    
    Returns:
        List[Dict]: Список новостей с полями title, url, source, date, description
    """
    logger.info(f"📰 Fetching articles from {EMINAR_NEWS_URL}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    news_items = []
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(EMINAR_NEWS_URL, headers=headers, timeout=30) as response:
                if response.status == 403:
                    logger.error("❌ Error: HTTP 403")
                    logger.error("⚠️ Site 7eminar.ua may be protected by CDN (Cloudflare)")
                    logger.error("💡 Possible solutions:")
                    logger.error("   1. Use Selenium/Playwright for browser automation")
                    logger.error("   2. Use proxy service")
                    logger.error("   3. Contact site administrators for API access")
                    return []
                
                if response.status != 200:
                    logger.error(f"❌ Error: HTTP {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'lxml')
                
                # Ищем все блоки div.card-news__body
                article_blocks = soup.find_all('div', class_='card-news__body')
                
                logger.info(f"📊 Found {len(article_blocks)} article blocks")
                
                for article in article_blocks:
                    try:
                        # Извлекаем заголовок
                        title_tag = article.find('h2', class_='card-news__title')
                        if not title_tag:
                            continue
                        
                        title = title_tag.get_text(strip=True)
                        
                        # Извлекаем ссылку
                        link_tag = article.find('a', class_='card-news__link')
                        if not link_tag:
                            continue
                        
                        url_path = link_tag.get('href', '')
                        
                        # Формируем полный URL
                        if url_path.startswith('/'):
                            full_url = f"https://7eminar.ua{url_path}"
                        elif not url_path.startswith('http'):
                            full_url = f"https://7eminar.ua/{url_path}"
                        else:
                            full_url = url_path
                        
                        # Извлекаем описание
                        description_div = article.find('div', class_='card-news__description')
                        description = ''
                        if description_div:
                            # Извлекаем текст из всех параграфов внутри
                            paragraphs = description_div.find_all('p')
                            if paragraphs:
                                description = ' '.join(p.get_text(strip=True) for p in paragraphs)
                            else:
                                description = description_div.get_text(strip=True)
                        
                        # Извлекаем дату
                        date_str = ''
                        date_div = article.find('div', class_='date-info')
                        if date_div:
                            date_str = date_div.get_text(strip=True)
                        
                        # Извлекаем категорию (опционально)
                        category = ''
                        category_tag = article.find('a', class_='card-news__category')
                        if category_tag:
                            category = category_tag.get_text(strip=True)
                        
                        # Извлекаем изображение (опционально)
                        image_url = ''
                        picture_tag = article.find('picture', class_='card-news__picture')
                        if picture_tag:
                            img_tag = picture_tag.find('img')
                            if img_tag:
                                image_url = img_tag.get('src', '')
                        
                        news_items.append({
                            'title': title,
                            'url': full_url,
                            'source': SOURCE_NAME,
                            'date': date_str,
                            'raw_date': date_str,
                            'description': description,
                            'category': category,
                            'image_url': image_url,
                        })
                        
                    except Exception as e:
                        logger.warning(f"⚠️ Error parsing article: {e}")
                        continue
                
                logger.info(f"✅ Successfully parsed {len(news_items)} articles from 7eminar.ua")
                
                # Парсим даты для всех новостей
                for item in news_items:
                    parsed_date = parse_7eminar_date(item['raw_date'])
                    if parsed_date:
                        item['published_date'] = parsed_date.isoformat()
                    else:
                        item['published_date'] = datetime.now().isoformat()
                
                return news_items
                
    except aiohttp.ClientError as e:
        logger.error(f"❌ Network error: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return []


def parse_7eminar_date(date_str: str) -> datetime:
    """
    Парсинг украинской даты с 7eminar.ua
    
    Примеры форматов:
    - "04.12.2025" -> дата в формате DD.MM.YYYY
    - "27.11.2025" -> дата в формате DD.MM.YYYY
    
    Args:
        date_str: Строка с датой
    
    Returns:
        datetime объект
    """
    if not date_str:
        return datetime.now()
    
    date_str = date_str.strip()
    now = datetime.now()
    
    try:
        # Формат "04.12.2025" (DD.MM.YYYY)
        date_match = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', date_str)
        if date_match:
            day = int(date_match.group(1))
            month = int(date_match.group(2))
            year = int(date_match.group(3))
            
            # Проверяем, есть ли время
            time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                return datetime(year, month, day, hour, minute)
            
            return datetime(year, month, day)
        
        # Формат с названиями месяцев на украинском
        month_map = {
            'січня': 1, 'січень': 1,
            'лютого': 2, 'лютий': 2,
            'березня': 3, 'березень': 3,
            'квітня': 4, 'квітень': 4,
            'травня': 5, 'травень': 5,
            'червня': 6, 'червень': 6,
            'липня': 7, 'липень': 7,
            'серпня': 8, 'серпень': 8,
            'вересня': 9, 'вересень': 9,
            'жовтня': 10, 'жовтень': 10,
            'листопада': 11, 'листопад': 11,
            'грудня': 12, 'грудень': 12,
        }
        
        parts = date_str.split()
        if len(parts) >= 3:
            try:
                day = int(parts[0])
                month_name = parts[1].lower()
                year = int(parts[2])
                
                month = month_map.get(month_name)
                if month:
                    return datetime(year, month, day)
            except (ValueError, IndexError):
                pass
    
    except Exception as e:
        logger.warning(f"⚠️ Could not parse date '{date_str}': {e}")
    
    # Если не удалось распарсить, возвращаем текущую дату
    return now


# Для тестирования
if __name__ == "__main__":
    import asyncio
    
    async def main():
        news = await crawl_7eminar()
        print(f"\nНайдено новостей и статей: {len(news)}")
        
        for i, item in enumerate(news[:10], 1):
            print(f"\n{i}. {item['title']}")
            print(f"   URL: {item['url']}")
            print(f"   Дата: {item['raw_date']}")
            print(f"   Категория: {item['category']}")
            print(f"   Описание: {item['description'][:100]}..." if item['description'] else "   Описание: -")
    
    asyncio.run(main())

