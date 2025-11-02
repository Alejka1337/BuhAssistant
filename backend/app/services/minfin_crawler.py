"""
Краулер для парсинга новостей с minfin.com.ua
"""
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import asyncio


class MinfinArticle:
    """Структура для статьи Minfin"""
    def __init__(self, title: str, url: str, source: str = "minfin.com.ua"):
        self.title = title
        self.url = url if url.startswith('http') else f"https://minfin.com.ua{url}"
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
        return f"<MinfinArticle(title='{self.title[:50]}...', url='{self.url}')>"


async def parse_minfin_page(url: str) -> List[MinfinArticle]:
    """
    Парсинг одной страницы minfin.com.ua
    
    Args:
        url: URL страницы для парсинга
    
    Returns:
        Список MinfinArticle
    """
    articles = []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status != 200:
                    print(f"❌ Minfin returned status {response.status} for {url}")
                    return []
                
                html = await response.text()
        
        soup = BeautifulSoup(html, 'lxml')
        
        # Ищем ul с классом "items"
        items_container = soup.find('ul', class_='items')
        
        if not items_container:
            print(f"⚠️ Container ul.items not found on {url}")
            return []
        
        # Ищем все li с классом "item"
        list_items = items_container.find_all('li', class_='item')
        
        print(f"📰 Found {len(list_items)} items on {url}")
        
        for li in list_items:
            try:
                # Ищем span с классом "link"
                link_span = li.find('span', class_='link')
                
                if not link_span:
                    # Альтернативный поиск: может быть просто a внутри li
                    link_elem = li.find('a', href=True)
                else:
                    link_elem = link_span.find('a', href=True)
                
                if not link_elem:
                    continue
                
                title = link_elem.get_text(strip=True)
                href = link_elem.get('href', '')
                
                if title and href:
                    article = MinfinArticle(title=title, url=href)
                    articles.append(article)
                    print(f"  ✅ Parsed: {title[:60]}...")
                    
            except Exception as e:
                print(f"  ❌ Error parsing item: {e}")
                continue
        
        print(f"✅ Successfully parsed {len(articles)} articles from {url}")
        return articles
        
    except asyncio.TimeoutError:
        print(f"⏱️ Timeout while parsing {url}")
        return []
    except Exception as e:
        print(f"❌ Error parsing {url}: {e}")
        import traceback
        traceback.print_exc()
        return []


async def crawl_minfin() -> List[MinfinArticle]:
    """
    Парсинг всех страниц minfin.com.ua
    
    Returns:
        Объединенный список всех статей
    """
    urls = [
        'https://minfin.com.ua/ua/articles/',
        'https://minfin.com.ua/ua/news/',
    ]
    
    print(f"🕷️ Starting Minfin crawler for {len(urls)} pages...")
    
    # Парсим страницы параллельно
    tasks = [parse_minfin_page(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Объединяем результаты
    all_articles = []
    for i, result in enumerate(results):
        if isinstance(result, list):
            all_articles.extend(result)
            print(f"  Page {urls[i]}: {len(result)} articles")
        elif isinstance(result, Exception):
            print(f"  Page {urls[i]}: Failed with error {result}")
    
    # Удаляем дубликаты по URL
    unique_articles = {}
    for article in all_articles:
        if article.url not in unique_articles:
            unique_articles[article.url] = article
    
    print(f"🎉 Minfin crawler finished: {len(unique_articles)} unique articles")
    return list(unique_articles.values())


# Для тестирования
if __name__ == "__main__":
    async def test():
        articles = await crawl_minfin()
        print(f"\n📊 Total articles: {len(articles)}")
        for i, article in enumerate(articles[:5], 1):
            print(f"{i}. {article.title}")
            print(f"   {article.url}")
    
    asyncio.run(test())

