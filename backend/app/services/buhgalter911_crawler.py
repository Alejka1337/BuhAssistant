"""
Краулер для парсинга новостей з buhgalter911.com
"""
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import asyncio


class Buhgalter911Article:
    """Структура для статьи buhgalter911.com"""
    def __init__(self, title: str, url: str, source: str = "buhgalter911.com"):
        self.title = title
        # Добавляем базовый URL если это относительная ссылка
        self.url = url if url.startswith('http') else f"https://buhgalter911.com{url}"
        self.source = source
        self.parsed_at = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        return {
            'title': self.title,
            'url': self.url,
            'source': self.source,
            'parsed_at': self.parsed_at.isoformat()
        }
    
    def __repr__(self):
        return f"<Buhgalter911Article(title='{self.title[:50]}...', url='{self.url}')>"


async def parse_buhgalter911_page(url: str = 'https://buhgalter911.com/uk/news/') -> List[Buhgalter911Article]:
    """
    Парсинг страницы новостей buhgalter911.com
    
    Args:
        url: URL страницы новостей
    
    Returns:
        Список объектов Buhgalter911Article
    """
    articles = []
    
    try:
        print(f"📰 Fetching news from {url}...")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=30) as response:
                if response.status != 200:
                    print(f"❌ Error: HTTP {response.status}")
                    return articles
                
                html = await response.text()
        
        # Парсинг HTML
        soup = BeautifulSoup(html, 'lxml')
        
        # Ищем все блоки с описаниями новостей напрямую
        # Используем lambda для поиска div с классом, который содержит 'news__description'
        news_descriptions = soup.find_all('div', class_=lambda x: x and 'news__description' in x)
        
        print(f"📰 Found {len(news_descriptions)} news descriptions on {url}")
        
        for description in news_descriptions:
            try:
                # Ищем ссылку на новость
                news_link = description.find('a', class_='news__link')
                
                if not news_link:
                    continue
                
                # Извлекаем URL и заголовок
                href = news_link.get('href', '')
                title = news_link.get_text(strip=True)
                
                if title and href:
                    article = Buhgalter911Article(
                        title=title,
                        url=href
                    )
                    articles.append(article)
                    print(f"  ✅ Parsed: {title[:70]}...")
                
            except Exception as e:
                print(f"  ❌ Error parsing description: {e}")
                continue
        
        print(f"✅ Successfully parsed {len(articles)} articles from {url}")
        
    except asyncio.TimeoutError:
        print(f"⏰ Timeout while fetching {url}")
    except Exception as e:
        print(f"❌ Error parsing {url}: {e}")
        import traceback
        traceback.print_exc()
    
    return articles


async def crawl_buhgalter911() -> List[Buhgalter911Article]:
    """
    Парсинг страницы новостей buhgalter911.com
    
    Returns:
        Список уникальных статей
    """
    url = 'https://buhgalter911.com/uk/news/'
    
    print(f"🕷️ Starting Buhgalter911.com crawler...")
    
    # Парсим страницу
    articles = await parse_buhgalter911_page(url)
    
    # Удаляем дубликаты по URL
    unique_articles = {}
    for article in articles:
        if article.url not in unique_articles:
            unique_articles[article.url] = article
    
    print(f"🎉 Buhgalter911.com crawler finished: {len(unique_articles)} unique articles")
    return list(unique_articles.values())


class Buhgalter911Crawler:
    """
    Класс для управления парсингом новостей с buhgalter911.com
    """
    
    def __init__(self):
        pass
    
    def crawl_all(self) -> List[Dict]:
        """
        Синхронная обертка для async crawl_buhgalter911()
        Возвращает список словарей вместо Buhgalter911Article объектов
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            articles = loop.run_until_complete(crawl_buhgalter911())
            # Конвертируем в словари для совместимости с API
            return [article.to_dict() for article in articles]
        finally:
            loop.close()


# Для тестирования
if __name__ == "__main__":
    async def test():
        articles = await crawl_buhgalter911()
        print(f"\n📊 Total articles: {len(articles)}")
        
        print(f"\n📰 First 10 articles:")
        for i, article in enumerate(articles[:10], 1):
            print(f"{i}. {article.title}")
            print(f"   URL: {article.url}")
    
    asyncio.run(test())

