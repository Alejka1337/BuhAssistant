"""
Краулер для парсинга новостей и статей с сайта buhplatforma.com.ua
Использует BeautifulSoup4 + aiohttp для парсинга
"""

import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime, timedelta
import logging
import re

logger = logging.getLogger(__name__)

# URL источников
BUHPLATFORMA_NEWS_URL = "https://buhplatforma.com.ua/news"
BUHPLATFORMA_ARTICLES_URL = "https://buhplatforma.com.ua/article"
SOURCE_NAME = "buhplatforma.com.ua"


async def crawl_buhplatforma() -> List[Dict]:
    """
    Парсинг новостей и статей с buhplatforma.com.ua
    
    Returns:
        List[Dict]: Список новостей с полями title, url, source, date, description
    """
    logger.info(f"📰 Fetching articles from buhplatforma.com.ua...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    news_items = []
    
    # Парсим обе страницы: новости и статьи
    urls = [
        (BUHPLATFORMA_NEWS_URL, "news"),
        (BUHPLATFORMA_ARTICLES_URL, "articles")
    ]
    
    try:
        async with aiohttp.ClientSession() as session:
            for url, content_type in urls:
                logger.info(f"  🔍 Parsing {content_type} from {url}...")
                
                try:
                    async with session.get(url, headers=headers, timeout=30) as response:
                        if response.status == 403:
                            logger.error(f"❌ Error: HTTP 403 for {url}")
                            logger.error("⚠️ Site buhplatforma.com.ua may be protected by CDN (Cloudflare)")
                            logger.error("💡 Possible solutions:")
                            logger.error("   1. Use Selenium/Playwright for browser automation")
                            logger.error("   2. Use proxy service")
                            logger.error("   3. Contact site administrators for API access")
                            continue
                        
                        if response.status != 200:
                            logger.error(f"❌ Error: HTTP {response.status} for {url}")
                            continue
                        
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')
                        
                        # Ищем контейнер с новостями/статьями
                        news_list = soup.find('div', class_='news-list')
                        
                        if not news_list:
                            logger.warning(f"⚠️ Could not find div.news-list on {url}")
                            continue
                        
                        # Ищем все блоки <article class="article">
                        article_blocks = news_list.find_all('article', class_='article')
                        
                        logger.info(f"  📊 Found {len(article_blocks)} {content_type} blocks")
                        
                        for article in article_blocks:
                            try:
                                # Извлекаем заголовок и ссылку
                                h4_tag = article.find('h4', class_='h4')
                                if not h4_tag:
                                    continue
                                
                                link = h4_tag.find('a')
                                if not link:
                                    continue
                                
                                title = link.get_text(strip=True)
                                url_path = link.get('href', '')
                                
                                # Формируем полный URL
                                if url_path.startswith('/'):
                                    full_url = f"https://buhplatforma.com.ua{url_path}"
                                elif not url_path.startswith('http'):
                                    full_url = f"https://buhplatforma.com.ua/{url_path}"
                                else:
                                    full_url = url_path
                                
                                # Извлекаем описание
                                description_div = article.find('div', class_='description')
                                description = description_div.get_text(strip=True) if description_div else ''
                                
                                # Извлекаем дату
                                date_str = ''
                                time_tag = article.find('time', class_='time')
                                if time_tag:
                                    # Пытаемся взять datetime атрибут
                                    datetime_attr = time_tag.get('datetime', '')
                                    if datetime_attr:
                                        date_str = datetime_attr
                                    else:
                                        # Если нет datetime, берем текст внутри тега
                                        date_str = time_tag.get_text(strip=True)
                                
                                # Извлекаем количество просмотров (опционально)
                                views = 0
                                views_div = article.find('div', class_='views')
                                if views_div:
                                    views_text = views_div.get_text(strip=True)
                                    # Извлекаем число из текста (например, "70503")
                                    views_match = re.search(r'(\d+)', views_text)
                                    if views_match:
                                        views = int(views_match.group(1))
                                
                                news_items.append({
                                    'title': title,
                                    'url': full_url,
                                    'source': SOURCE_NAME,
                                    'date': date_str,
                                    'raw_date': date_str,
                                    'description': description,
                                    'views': views,
                                    'content_type': content_type,
                                })
                                
                            except Exception as e:
                                logger.warning(f"⚠️ Error parsing article: {e}")
                                continue
                        
                        logger.info(f"  ✅ Successfully parsed {len(article_blocks)} {content_type}")
                        
                except aiohttp.ClientError as e:
                    logger.error(f"❌ Network error for {url}: {e}")
                    continue
                except Exception as e:
                    logger.error(f"❌ Unexpected error for {url}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            logger.info(f"✅ Total articles parsed from buhplatforma.com.ua: {len(news_items)}")
            
            # Парсим даты для всех новостей
            for item in news_items:
                parsed_date = parse_buhplatforma_date(item['raw_date'])
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


def parse_buhplatforma_date(date_str: str) -> datetime:
    """
    Парсинг украинской даты с buhplatforma.com.ua
    
    Примеры форматов:
    - "2025-12-04T09:01:00+02:00" -> ISO 8601 с timezone
    - "4 грудня 2025" -> дата с украинским месяцем
    - "Сьогодні 11:30" -> сегодня
    - "Вчора 15:45" -> вчера
    
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
        # Формат ISO 8601 (из атрибута datetime)
        if 'T' in date_str and ('+' in date_str or 'Z' in date_str):
            # Удаляем timezone info для упрощения
            # Пример: "2025-12-04T09:01:00+02:00" -> "2025-12-04T09:01:00"
            clean_date = date_str.split('+')[0].split('Z')[0]
            return datetime.fromisoformat(clean_date)
        
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
        
        # Формат "4 грудня 2025" или "21 листопада 2025"
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
        news = await crawl_buhplatforma()
        print(f"\nНайдено новостей и статей: {len(news)}")
        
        # Разделяем по типу контента
        news_count = sum(1 for item in news if item['content_type'] == 'news')
        articles_count = sum(1 for item in news if item['content_type'] == 'articles')
        
        print(f"  - Новостей: {news_count}")
        print(f"  - Статей: {articles_count}")
        
        for i, item in enumerate(news[:5], 1):
            print(f"\n{i}. [{item['content_type']}] {item['title']}")
            print(f"   URL: {item['url']}")
            print(f"   Дата: {item['raw_date']}")
            print(f"   Описание: {item['description'][:100]}...")
            print(f"   Просмотров: {item['views']}")
    
    asyncio.run(main())

