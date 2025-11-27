"""
Краулер для парсинга новостей с tax.gov.ua
"""
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import asyncio


class TaxGovUaArticle:
    """Структура для статьи tax.gov.ua"""
    def __init__(self, title: str, url: str, source: str = "tax.gov.ua"):
        self.title = title
        # Добавляем базовый URL если это относительная ссылка
        self.url = url if url.startswith('http') else f"https://tax.gov.ua{url}"
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
        return f"<TaxGovUaArticle(title='{self.title[:50]}...', url='{self.url}')>"


async def parse_tax_gov_ua_page(url: str = 'https://tax.gov.ua/media-tsentr/novini/') -> List[TaxGovUaArticle]:
    """
    Парсинг страницы новостей tax.gov.ua
    
    Args:
        url: URL страницы новостей
    
    Returns:
        Список объектов TaxGovUaArticle
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
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        # Добавляем задержку перед запросом
        await asyncio.sleep(1)
        
        # Отключаем проверку SSL если нужно
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(url, headers=headers, timeout=30) as response:
                if response.status != 200:
                    print(f"❌ Error: HTTP {response.status}")
                    print(f"⚠️ Site tax.gov.ua may be protected by CDN (Cloudflare/Akamai)")
                    print(f"💡 Possible solutions:")
                    print(f"   1. Use Selenium/Playwright for browser automation")
                    print(f"   2. Use proxy service")
                    print(f"   3. Contact site administrators for API access")
                    return articles
                
                html = await response.text()
        
        # Парсинг HTML
        soup = BeautifulSoup(html, 'lxml')
        
        # Ищем контейнер с новостями
        news_list = soup.find('div', class_='news__list')
        
        if not news_list:
            print(f"⚠️ News list container not found on {url}")
            return articles
        
        # Ищем все элементы новостей
        news_items = news_list.find_all('div', class_='news__item')
        
        print(f"📰 Found {len(news_items)} items on {url}")
        
        for item in news_items:
            try:
                # Ищем ссылку с заголовком
                title_link = item.find('a', class_='news__title')
                
                if not title_link:
                    continue
                
                # Извлекаем заголовок и URL
                title = title_link.get_text(strip=True)
                href = title_link.get('href', '')
                
                if title and href:
                    article = TaxGovUaArticle(
                        title=title,
                        url=href
                    )
                    articles.append(article)
                    print(f"  ✅ Parsed: {title[:70]}...")
                
            except Exception as e:
                print(f"  ❌ Error parsing item: {e}")
                continue
        
        print(f"✅ Successfully parsed {len(articles)} articles from {url}")
        
    except asyncio.TimeoutError:
        print(f"⏰ Timeout while fetching {url}")
    except Exception as e:
        print(f"❌ Error parsing {url}: {e}")
        import traceback
        traceback.print_exc()
    
    return articles


async def crawl_tax_gov_ua() -> List[TaxGovUaArticle]:
    """
    Парсинг страницы новостей tax.gov.ua
    
    Returns:
        Список уникальных статей
    """
    url = 'https://tax.gov.ua/media-tsentr/novini/'
    
    print(f"🕷️ Starting Tax.gov.ua crawler...")
    
    # Парсим страницу
    articles = await parse_tax_gov_ua_page(url)
    
    # Удаляем дубликаты по URL
    unique_articles = {}
    for article in articles:
        if article.url not in unique_articles:
            unique_articles[article.url] = article
    
    print(f"🎉 Tax.gov.ua crawler finished: {len(unique_articles)} unique articles")
    return list(unique_articles.values())


class TaxGovUaCrawler:
    """
    Класс для управления парсингом новостей с tax.gov.ua
    """
    
    def __init__(self):
        pass
    
    def crawl_all(self) -> List[Dict]:
        """
        Синхронная обертка для async crawl_tax_gov_ua()
        Возвращает список словарей вместо TaxGovUaArticle объектов
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            articles = loop.run_until_complete(crawl_tax_gov_ua())
            # Конвертируем в словари для совместимости с API
            return [article.to_dict() for article in articles]
        finally:
            loop.close()


# Для тестирования
if __name__ == "__main__":
    async def test():
        articles = await crawl_tax_gov_ua()
        print(f"\n📊 Total articles: {len(articles)}")
        for i, article in enumerate(articles[:5], 1):
            print(f"{i}. {article.title}")
            print(f"   {article.url}")
    
    asyncio.run(test())

