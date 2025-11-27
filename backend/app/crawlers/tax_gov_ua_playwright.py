"""
Краулер для парсинга новостей с сайта tax.gov.ua
Использует Playwright для обхода защиты CDN
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Константы
TAX_GOV_UA_URL = "https://tax.gov.ua/media-tsentr/novini/"
SOURCE_NAME = "tax.gov.ua"


class TaxGovUaPlaywrightCrawler:
    """Краулер для tax.gov.ua с использованием Playwright"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    async def __aenter__(self):
        """Асинхронный контекстный менеджер - вход"""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Асинхронный контекстный менеджер - выход"""
        await self.close()
    
    async def initialize(self):
        """Инициализация браузера и страницы"""
        logger.info("Инициализация Playwright браузера...")
        
        self.playwright = await async_playwright().start()
        
        # Запускаем Chromium в headless режиме
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
            ]
        )
        
        # Создаем контекст браузера с user-agent
        context = await self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='uk-UA',
        )
        
        self.page = await context.new_page()
        
        # Устанавливаем timeout
        self.page.set_default_timeout(30000)  # 30 секунд
        
        logger.info("Playwright браузер инициализирован")
    
    async def close(self):
        """Закрытие браузера"""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        logger.info("Playwright браузер закрыт")
    
    async def parse_news_list(self) -> List[Dict]:
        """
        Парсинг списка новостей со страницы
        
        Returns:
            List[Dict]: Список новостей с полями: title, url, date, source
        """
        if not self.page:
            raise RuntimeError("Браузер не инициализирован. Используйте async with.")
        
        logger.info(f"Переход на страницу: {TAX_GOV_UA_URL}")
        
        try:
            # Переходим на страницу новостей
            response = await self.page.goto(TAX_GOV_UA_URL, wait_until='networkidle')
            
            if not response or response.status != 200:
                logger.error(f"Ошибка загрузки страницы: {response.status if response else 'No response'}")
                return []
            
            logger.info("Страница успешно загружена, ожидаем появления новостей...")
            
            # Ждем появления блоков с новостями
            try:
                await self.page.wait_for_selector('div.news__item', timeout=10000)
            except Exception as e:
                logger.warning(f"Timeout ожидания новостей: {e}")
                # Попробуем продолжить, возможно элементы уже загружены
            
            # Извлекаем данные новостей
            news_items = await self.page.evaluate('''() => {
                const items = [];
                const newsBlocks = document.querySelectorAll('div.news__item');
                
                newsBlocks.forEach(block => {
                    try {
                        // Ищем дату
                        const dateEl = block.querySelector('div.shortnews__date');
                        const date = dateEl ? dateEl.textContent.trim() : null;
                        
                        // Ищем заголовок и ссылку
                        const linkEl = block.querySelector('a.news__title');
                        const title = linkEl ? linkEl.textContent.trim() : null;
                        const href = linkEl ? linkEl.getAttribute('href') : null;
                        
                        if (title && href && date) {
                            items.push({
                                title: title,
                                url: href,
                                date: date
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing news item:', e);
                    }
                });
                
                return items;
            }''')
            
            logger.info(f"Найдено {len(news_items)} новостей")
            
            # Преобразуем относительные URL в абсолютные
            base_url = "https://tax.gov.ua"
            processed_items = []
            
            for item in news_items:
                url = item['url']
                if url.startswith('/'):
                    url = base_url + url
                
                processed_items.append({
                    'title': item['title'],
                    'url': url,
                    'date': item['date'],
                    'source': SOURCE_NAME,
                    'raw_date': item['date'],  # Сохраняем оригинальную дату для парсинга
                })
            
            return processed_items
        
        except Exception as e:
            logger.error(f"Ошибка при парсинге новостей: {str(e)}")
            return []
    
    async def parse_article_content(self, url: str) -> Optional[Dict]:
        """
        Парсинг содержимого статьи
        
        Args:
            url: URL статьи
        
        Returns:
            Dict с полями: content, images
        """
        if not self.page:
            raise RuntimeError("Браузер не инициализирован")
        
        try:
            logger.info(f"Парсинг статьи: {url}")
            
            await self.page.goto(url, wait_until='networkidle')
            
            # Извлекаем контент статьи
            article_data = await self.page.evaluate('''() => {
                // Ищем основной контент (может быть в разных селекторах)
                const contentSelectors = [
                    'div.article__content',
                    'div.news-content',
                    'div.content',
                    'article',
                ];
                
                let content = '';
                for (const selector of contentSelectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        // Удаляем лишние элементы (навигацию, рекламу и т.д.)
                        const clone = el.cloneNode(true);
                        const toRemove = clone.querySelectorAll('script, style, nav, .advertisement, .social-share');
                        toRemove.forEach(el => el.remove());
                        
                        content = clone.textContent || clone.innerText || '';
                        break;
                    }
                }
                
                // Извлекаем изображения
                const images = [];
                const imgElements = document.querySelectorAll('img');
                imgElements.forEach(img => {
                    const src = img.src || img.getAttribute('data-src');
                    if (src && !src.includes('logo') && !src.includes('icon')) {
                        images.push(src);
                    }
                });
                
                return {
                    content: content.trim(),
                    images: images
                };
            }''')
            
            return article_data
        
        except Exception as e:
            logger.error(f"Ошибка при парсинге статьи {url}: {str(e)}")
            return None
    
    def parse_ukrainian_date(self, date_str: str) -> Optional[datetime]:
        """
        Парсинг украинской даты в формате "21 листопада 2025"
        
        Args:
            date_str: Строка с датой на украинском
        
        Returns:
            datetime объект или None
        """
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
        
        try:
            parts = date_str.strip().split()
            if len(parts) >= 3:
                day = int(parts[0])
                month_name = parts[1].lower()
                year = int(parts[2])
                
                month = month_map.get(month_name)
                if month:
                    return datetime(year, month, day)
        except Exception as e:
            logger.warning(f"Не удалось распарсить дату '{date_str}': {e}")
        
        return None


async def crawl_tax_gov_ua() -> List[Dict]:
    """
    Основная функция для парсинга tax.gov.ua
    
    Returns:
        List[Dict]: Список новостей
    """
    async with TaxGovUaPlaywrightCrawler() as crawler:
        news_items = await crawler.parse_news_list()
        
        # Парсим даты
        for item in news_items:
            parsed_date = crawler.parse_ukrainian_date(item['raw_date'])
            if parsed_date:
                item['published_date'] = parsed_date.isoformat()
            else:
                item['published_date'] = datetime.now().isoformat()
        
        logger.info(f"Успешно спарсено {len(news_items)} новостей с tax.gov.ua")
        return news_items


# Для тестирования
if __name__ == "__main__":
    async def main():
        news = await crawl_tax_gov_ua()
        print(f"\nНайдено новостей: {len(news)}")
        for i, item in enumerate(news[:5], 1):
            print(f"\n{i}. {item['title']}")
            print(f"   URL: {item['url']}")
            print(f"   Дата: {item['raw_date']}")
    
    asyncio.run(main())

