"""
Краулер для парсинга новостей с сайта dtkt.ua (Дебет-Кредит)
Использует BeautifulSoup4 + aiohttp для парсинга
"""

import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime, timedelta
import logging
import re

logger = logging.getLogger(__name__)

# URL источника новостей
DTKT_NEWS_URL = "https://news.dtkt.ua/?sort=main"
SOURCE_NAME = "dtkt.ua"


async def crawl_dtkt() -> List[Dict]:
    """
    Парсинг новостей с dtkt.ua
    
    Returns:
        List[Dict]: Список новостей с полями title, url, source, date
    """
    logger.info(f"📰 Fetching news from {DTKT_NEWS_URL}...")
    
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
            async with session.get(DTKT_NEWS_URL, headers=headers, timeout=30) as response:
                if response.status == 403:
                    logger.error("❌ Error: HTTP 403")
                    logger.error("⚠️ Site dtkt.ua may be protected by CDN (Cloudflare/Akamai)")
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
                
                # Ищем все блоки с новостями
                article_blocks = soup.find_all('div', class_='article-item')
                
                logger.info(f"📊 Found {len(article_blocks)} article blocks")
                
                for article in article_blocks:
                    try:
                        # Извлекаем заголовок и ссылку
                        title_div = article.find('div', class_='article-item-title')
                        if not title_div:
                            continue
                        
                        link = title_div.find('a')
                        if not link:
                            continue
                        
                        title = link.get_text(strip=True)
                        url = link.get('href', '')
                        
                        # Формируем полный URL
                        if url.startswith('/'):
                            url = f"https://news.dtkt.ua{url}"
                        elif not url.startswith('http'):
                            url = f"https://news.dtkt.ua/{url}"
                        
                        # Извлекаем дату
                        info_div = article.find('div', class_='article-item-info')
                        date_str = ''
                        if info_div:
                            date_span = info_div.find('span', class_='date-info')
                            if date_span:
                                date_str = date_span.get_text(strip=True)
                        
                        news_items.append({
                            'title': title,
                            'url': url,
                            'source': SOURCE_NAME,
                            'date': date_str,
                            'raw_date': date_str,
                        })
                        
                    except Exception as e:
                        logger.warning(f"⚠️ Error parsing article: {e}")
                        continue
                
                logger.info(f"✅ Successfully parsed {len(news_items)} articles from dtkt.ua")
                
                # Парсим даты для всех новостей
                for item in news_items:
                    parsed_date = parse_dtkt_date(item['raw_date'])
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


def parse_dtkt_date(date_str: str) -> datetime:
    """
    Парсинг украинской даты с dtkt.ua
    
    Примеры форматов:
    - "Сьогодні 11:30" -> сегодня
    - "Вчора 15:45" -> вчера
    - "21.11.2025" -> конкретная дата
    - "19.11.2025 10:30" -> дата и время
    
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
        # "Сьогодні 11:30" или "Сьогодні"
        if 'Сьогодні' in date_str or 'сьогодні' in date_str:
            time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return now
        
        # "Вчора 15:45" или "Вчора"
        if 'Вчора' in date_str or 'вчора' in date_str:
            yesterday = now - timedelta(days=1)
            time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2))
                return yesterday.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return yesterday
        
        # Формат "21.11.2025" или "21.11.2025 10:30"
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
        news = await crawl_dtkt()
        print(f"\nНайдено новостей: {len(news)}")
        for i, item in enumerate(news[:10], 1):
            print(f"\n{i}. {item['title']}")
            print(f"   URL: {item['url']}")
            print(f"   Дата: {item['raw_date']}")
    
    asyncio.run(main())

