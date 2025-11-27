"""
Краулер для парсинга новостей з liga.net
"""
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import asyncio


class LigaNetArticle:
    """Структура для статьи liga.net"""
    def __init__(self, title: str, url: str, category: str = None, source: str = "liga.net"):
        self.title = title
        self.url = url  # liga.net використовує повні URL
        self.category = category
        self.source = source
        self.parsed_at = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        return {
            'title': self.title,
            'url': self.url,
            'source': self.source,
            'category': self.category,
            'parsed_at': self.parsed_at.isoformat()
        }
    
    def __repr__(self):
        return f"<LigaNetArticle(title='{self.title[:50]}...', url='{self.url}', category='{self.category}')>"


async def parse_liga_net_page(url: str = 'https://news.liga.net/ua') -> List[LigaNetArticle]:
    """
    Парсинг страницы новостей liga.net
    
    Args:
        url: URL страницы новостей
    
    Returns:
        Список объектов LigaNetArticle
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
        
        # Ищем контейнер с новостями
        news_container = soup.find('div', class_='news-list-page')
        
        if not news_container:
            print(f"⚠️ News container not found on {url}")
            return articles
        
        # Ищем все карточки новостей
        news_cards = news_container.find_all('article', class_='news-card')
        
        print(f"📰 Found {len(news_cards)} news cards on {url}")
        
        for card in news_cards:
            try:
                # Ищем ссылку с заголовком
                title_link = card.find('a', class_='news-card__title')
                
                if not title_link:
                    continue
                
                # Извлекаем URL
                article_url = title_link.get('href', '')
                
                # Извлекаем заголовок из h4
                h4_tag = title_link.find('h4')
                if not h4_tag:
                    continue
                
                title = h4_tag.get_text(strip=True)
                
                # Извлекаем категорию
                category = None
                badge = card.find('a', class_='news-card__badge')
                if badge:
                    category = badge.get_text(strip=True)
                
                if title and article_url:
                    article = LigaNetArticle(
                        title=title,
                        url=article_url,
                        category=category
                    )
                    articles.append(article)
                    
                    # Логирование с категорией
                    cat_info = f" [{category}]" if category else ""
                    print(f"  ✅ Parsed: {title[:60]}...{cat_info}")
                
            except Exception as e:
                print(f"  ❌ Error parsing card: {e}")
                continue
        
        print(f"✅ Successfully parsed {len(articles)} articles from {url}")
        
    except asyncio.TimeoutError:
        print(f"⏰ Timeout while fetching {url}")
    except Exception as e:
        print(f"❌ Error parsing {url}: {e}")
        import traceback
        traceback.print_exc()
    
    return articles


async def crawl_liga_net() -> List[LigaNetArticle]:
    """
    Парсинг страницы новостей liga.net
    
    Returns:
        Список уникальных статей
    """
    url = 'https://news.liga.net/ua'
    
    print(f"🕷️ Starting Liga.net crawler...")
    
    # Парсим страницу
    articles = await parse_liga_net_page(url)
    
    # Удаляем дубликаты по URL
    unique_articles = {}
    for article in articles:
        if article.url not in unique_articles:
            unique_articles[article.url] = article
    
    print(f"🎉 Liga.net crawler finished: {len(unique_articles)} unique articles")
    return list(unique_articles.values())


class LigaNetCrawler:
    """
    Класс для управления парсингом новостей с liga.net
    """
    
    def __init__(self):
        pass
    
    def crawl_all(self) -> List[Dict]:
        """
        Синхронная обертка для async crawl_liga_net()
        Возвращает список словарей вместо LigaNetArticle объектов
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            articles = loop.run_until_complete(crawl_liga_net())
            # Конвертируем в словари для совместимости с API
            return [article.to_dict() for article in articles]
        finally:
            loop.close()


# Для тестирования
if __name__ == "__main__":
    async def test():
        articles = await crawl_liga_net()
        print(f"\n📊 Total articles: {len(articles)}")
        
        # Группируем по категориям
        by_category = {}
        for article in articles:
            cat = article.category or "Без категорії"
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(article)
        
        print(f"\n📂 By category:")
        for cat, arts in by_category.items():
            print(f"  {cat}: {len(arts)} articles")
        
        print(f"\n📰 First 5 articles:")
        for i, article in enumerate(articles[:5], 1):
            print(f"{i}. {article.title}")
            print(f"   Category: {article.category or 'N/A'}")
            print(f"   URL: {article.url}")
    
    asyncio.run(test())

