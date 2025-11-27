"""
Celery tasks для автоматического парсинга новостей
"""
import logging
import asyncio
from celery import shared_task
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.services.minfin_crawler import MinfinCrawler
from app.services.liga_net_crawler import LigaNetCrawler
from app.services.buhgalter911_crawler import Buhgalter911Crawler
from app.services.news_filter import NewsFilterService, filter_relevant_news
from app.models.news import News
from app.core.config import settings
from datetime import datetime

# Новые Playwright парсеры
from app.crawlers.tax_gov_ua_playwright import crawl_tax_gov_ua as crawl_tax_gov_ua_playwright
from app.crawlers.diia_gov_ua_playwright import crawl_diia_gov_ua as crawl_diia_gov_ua_playwright
from app.crawlers.dtkt_crawler import crawl_dtkt

logger = logging.getLogger(__name__)


@shared_task(name="crawl_minfin_news_task")
def crawl_minfin_news_task():
    """
    Celery task для автоматического парсинга новостей с minfin.com.ua
    """
    logger.info("🕷️ Starting scheduled Minfin crawler task...")
    
    db: Session = SessionLocal()
    
    try:
        # Парсинг новостей
        crawler = MinfinCrawler()
        all_news = crawler.crawl_all()
        
        logger.info(f"📰 Crawled {len(all_news)} news items")
        
        # Фильтрация через OpenAI
        filter_service = NewsFilterService(api_key=settings.OPENAI_API_KEY)
        filtered_news = filter_service.filter_relevant_news(all_news)
        
        logger.info(f"✅ OpenAI filtered: {len(filtered_news)}/{len(all_news)} relevant articles")
        
        # Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_news:
            # Проверка на дубликаты по URL
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                logger.info(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создание новой записи
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=article.get('categories', []),
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow()
            )
            
            db.add(news_item)
            saved_count += 1
            logger.info(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            'status': 'success',
            'parsed': len(all_news),
            'filtered': len(filtered_news),
            'saved': saved_count,
            'skipped': skipped_count
        }
        
        logger.info(f"✅ Scheduled crawler task finished: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Scheduled crawler task error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


@shared_task(name="crawl_liga_net_news_task")
def crawl_liga_net_news_task():
    """
    Celery task для автоматического парсинга новостей с liga.net
    """
    logger.info("🕷️ Starting scheduled Liga.net crawler task...")
    
    db: Session = SessionLocal()
    
    try:
        # Парсинг новостей
        crawler = LigaNetCrawler()
        all_news = crawler.crawl_all()
        
        logger.info(f"📰 Crawled {len(all_news)} news items from Liga.net")
        
        # Фильтрация через OpenAI
        filter_service = NewsFilterService(api_key=settings.OPENAI_API_KEY)
        filtered_news = filter_service.filter_relevant_news(all_news)
        
        logger.info(f"✅ OpenAI filtered: {len(filtered_news)}/{len(all_news)} relevant articles")
        
        # Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_news:
            # Проверка на дубликаты по URL
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                logger.info(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создание новой записи
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=article.get('categories', []),
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow()
            )
            
            db.add(news_item)
            saved_count += 1
            logger.info(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            'status': 'success',
            'source': 'liga.net',
            'parsed': len(all_news),
            'filtered': len(filtered_news),
            'saved': saved_count,
            'skipped': skipped_count
        }
        
        logger.info(f"✅ Scheduled Liga.net crawler task finished: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Scheduled Liga.net crawler task error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


@shared_task(name="crawl_buhgalter911_news_task")
def crawl_buhgalter911_news_task():
    """
    Celery task для автоматического парсинга новостей с buhgalter911.com
    """
    logger.info("🕷️ Starting scheduled Buhgalter911.com crawler task...")
    
    db: Session = SessionLocal()
    
    try:
        # Парсинг новостей
        crawler = Buhgalter911Crawler()
        all_news = crawler.crawl_all()
        
        logger.info(f"📰 Crawled {len(all_news)} news items from Buhgalter911.com")
        
        # Фильтрация через OpenAI
        filter_service = NewsFilterService(api_key=settings.OPENAI_API_KEY)
        filtered_news = filter_service.filter_relevant_news(all_news)
        
        logger.info(f"✅ OpenAI filtered: {len(filtered_news)}/{len(all_news)} relevant articles")
        
        # Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_news:
            # Проверка на дубликаты по URL
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                logger.info(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создание новой записи
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=article.get('categories', []),
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow()
            )
            
            db.add(news_item)
            saved_count += 1
            logger.info(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            'status': 'success',
            'source': 'buhgalter911.com',
            'parsed': len(all_news),
            'filtered': len(filtered_news),
            'saved': saved_count,
            'skipped': skipped_count
        }
        
        logger.info(f"✅ Scheduled Buhgalter911.com crawler task finished: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Scheduled Buhgalter911.com crawler task error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


@shared_task(name="crawl_tax_gov_ua_playwright_task")
def crawl_tax_gov_ua_playwright_task():
    """
    Celery task для автоматического парсинга новостей с tax.gov.ua через Playwright
    """
    logger.info("🕷️ Starting scheduled Tax.gov.ua Playwright crawler task...")
    
    db: Session = SessionLocal()
    
    try:
        # Парсинг новостей через Playwright (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        all_news = loop.run_until_complete(crawl_tax_gov_ua_playwright())
        loop.close()
        
        logger.info(f"📰 Crawled {len(all_news)} news items from Tax.gov.ua")
        
        if not all_news:
            return {
                'status': 'warning',
                'source': 'tax.gov.ua',
                'parsed': 0,
                'filtered': 0,
                'saved': 0,
                'skipped': 0
            }
        
        # Фильтрация через OpenAI (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        filtered_news = loop.run_until_complete(filter_relevant_news(all_news))
        loop.close()
        
        logger.info(f"✅ OpenAI filtered: {len(filtered_news)}/{len(all_news)} relevant articles")
        
        # Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_news:
            # Проверка на дубликаты по URL
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                logger.info(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Парсим дату
            try:
                if 'published_date' in article and article['published_date']:
                    published_at = datetime.fromisoformat(article['published_date'])
                else:
                    published_at = datetime.utcnow()
            except:
                published_at = datetime.utcnow()
            
            # Создание новой записи
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article.get('source', 'tax.gov.ua'),
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=published_at
            )
            
            db.add(news_item)
            saved_count += 1
            logger.info(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            'status': 'success',
            'source': 'tax.gov.ua',
            'parsed': len(all_news),
            'filtered': len(filtered_news),
            'saved': saved_count,
            'skipped': skipped_count
        }
        
        logger.info(f"✅ Scheduled Tax.gov.ua Playwright crawler task finished: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Scheduled Tax.gov.ua Playwright crawler task error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


@shared_task(name="crawl_diia_gov_ua_playwright_task")
def crawl_diia_gov_ua_playwright_task():
    """
    Celery task для автоматического парсинга новостей с diia.gov.ua через Playwright
    """
    logger.info("🕷️ Starting scheduled Diia.gov.ua Playwright crawler task...")
    
    db: Session = SessionLocal()
    
    try:
        # Парсинг новостей через Playwright (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        all_news = loop.run_until_complete(crawl_diia_gov_ua_playwright())
        loop.close()
        
        logger.info(f"📰 Crawled {len(all_news)} news items from Diia.gov.ua")
        
        if not all_news:
            return {
                'status': 'warning',
                'source': 'diia.gov.ua',
                'parsed': 0,
                'filtered': 0,
                'saved': 0,
                'skipped': 0
            }
        
        # Фильтрация через OpenAI (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        filtered_news = loop.run_until_complete(filter_relevant_news(all_news))
        loop.close()
        
        logger.info(f"✅ OpenAI filtered: {len(filtered_news)}/{len(all_news)} relevant articles")
        
        # Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_news:
            # Проверка на дубликаты по URL
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                logger.info(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Парсим дату
            try:
                if 'published_date' in article and article['published_date']:
                    published_at = datetime.fromisoformat(article['published_date'])
                else:
                    published_at = datetime.utcnow()
            except:
                published_at = datetime.utcnow()
            
            # Создание новой записи
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article.get('source', 'diia.gov.ua'),
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=published_at
            )
            
            db.add(news_item)
            saved_count += 1
            logger.info(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            'status': 'success',
            'source': 'diia.gov.ua',
            'parsed': len(all_news),
            'filtered': len(filtered_news),
            'saved': saved_count,
            'skipped': skipped_count
        }
        
        logger.info(f"✅ Scheduled Diia.gov.ua Playwright crawler task finished: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Scheduled Diia.gov.ua Playwright crawler task error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


@shared_task(name="crawl_dtkt_task")
def crawl_dtkt_task():
    """
    Celery task для автоматического парсинга новостей с dtkt.ua
    """
    logger.info("🕷️ Starting scheduled dtkt.ua crawler task...")
    
    db: Session = SessionLocal()
    
    try:
        # Парсинг новостей (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        all_news = loop.run_until_complete(crawl_dtkt())
        loop.close()
        
        logger.info(f"📰 Crawled {len(all_news)} news items from dtkt.ua")
        
        if not all_news:
            return {
                'status': 'warning',
                'source': 'dtkt.ua',
                'parsed': 0,
                'filtered': 0,
                'saved': 0,
                'skipped': 0
            }
        
        # Фильтрация через OpenAI (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        filtered_news = loop.run_until_complete(filter_relevant_news(all_news))
        loop.close()
        
        logger.info(f"✅ OpenAI filtered: {len(filtered_news)}/{len(all_news)} relevant articles")
        
        # Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_news:
            # Проверка на дубликаты по URL
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                logger.info(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Парсим дату
            try:
                if 'published_date' in article and article['published_date']:
                    published_at = datetime.fromisoformat(article['published_date'])
                else:
                    published_at = datetime.utcnow()
            except:
                published_at = datetime.utcnow()
            
            # Создание новой записи
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article.get('source', 'dtkt.ua'),
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=published_at
            )
            
            db.add(news_item)
            saved_count += 1
            logger.info(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            'status': 'success',
            'source': 'dtkt.ua',
            'parsed': len(all_news),
            'filtered': len(filtered_news),
            'saved': saved_count,
            'skipped': skipped_count
        }
        
        logger.info(f"✅ Scheduled dtkt.ua crawler task finished: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Scheduled dtkt.ua crawler task error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


@shared_task(name="crawl_all_news_sources_task")
def crawl_all_news_sources_task():
    """
    Celery task для парсинга ВСЕХ источников новостей
    
    Запускает все краулеры последовательно:
    1. Minfin.com.ua (BS4)
    2. Liga.net (BS4)
    3. Buhgalter911.com (BS4)
    4. Tax.gov.ua (Playwright) ⭐ NEW
    5. Diia.gov.ua (Playwright) ⭐ NEW
    6. Dtkt.ua (BS4) ⭐ NEW
    
    Для каждого источника:
    - Парсит новости
    - Фильтрует через OpenAI
    - Сохраняет только новые релевантные новости в БД
    """
    logger.info("=" * 80)
    logger.info(f"🕷️ Starting FULL NEWS CRAWL at {datetime.utcnow().isoformat()}")
    logger.info("=" * 80)
    
    results = []
    
    # 1. Minfin.com.ua
    try:
        logger.info("\n📰 [1/6] Crawling Minfin.com.ua...")
        minfin_result = crawl_minfin_news_task()
        results.append(minfin_result)
        logger.info(f"✅ Minfin: {minfin_result}")
    except Exception as e:
        logger.error(f"❌ Minfin crawler failed: {str(e)}")
        results.append({'status': 'error', 'source': 'minfin.com.ua', 'error': str(e)})
    
    # 2. Liga.net
    try:
        logger.info("\n📰 [2/6] Crawling Liga.net...")
        liga_result = crawl_liga_net_news_task()
        results.append(liga_result)
        logger.info(f"✅ Liga.net: {liga_result}")
    except Exception as e:
        logger.error(f"❌ Liga.net crawler failed: {str(e)}")
        results.append({'status': 'error', 'source': 'liga.net', 'error': str(e)})
    
    # 3. Buhgalter911.com
    try:
        logger.info("\n📰 [3/6] Crawling Buhgalter911.com...")
        buhgalter_result = crawl_buhgalter911_news_task()
        results.append(buhgalter_result)
        logger.info(f"✅ Buhgalter911.com: {buhgalter_result}")
    except Exception as e:
        logger.error(f"❌ Buhgalter911.com crawler failed: {str(e)}")
        results.append({'status': 'error', 'source': 'buhgalter911.com', 'error': str(e)})
    
    # 4. Tax.gov.ua (Playwright) ⭐ NEW
    try:
        logger.info("\n📰 [4/6] Crawling Tax.gov.ua (Playwright)...")
        tax_result = crawl_tax_gov_ua_playwright_task()
        results.append(tax_result)
        logger.info(f"✅ Tax.gov.ua: {tax_result}")
    except Exception as e:
        logger.error(f"❌ Tax.gov.ua Playwright crawler failed: {str(e)}")
        results.append({'status': 'error', 'source': 'tax.gov.ua', 'error': str(e)})
    
    # 5. Diia.gov.ua (Playwright) ⭐ NEW
    try:
        logger.info("\n📰 [5/6] Crawling Diia.gov.ua (Playwright)...")
        diia_result = crawl_diia_gov_ua_playwright_task()
        results.append(diia_result)
        logger.info(f"✅ Diia.gov.ua: {diia_result}")
    except Exception as e:
        logger.error(f"❌ Diia.gov.ua Playwright crawler failed: {str(e)}")
        results.append({'status': 'error', 'source': 'diia.gov.ua', 'error': str(e)})
    
    # 6. Dtkt.ua (BS4) ⭐ NEW
    try:
        logger.info("\n📰 [6/6] Crawling Dtkt.ua...")
        dtkt_result = crawl_dtkt_task()
        results.append(dtkt_result)
        logger.info(f"✅ Dtkt.ua: {dtkt_result}")
    except Exception as e:
        logger.error(f"❌ Dtkt.ua crawler failed: {str(e)}")
        results.append({'status': 'error', 'source': 'dtkt.ua', 'error': str(e)})
    
    # Итоговая статистика
    total_parsed = sum(r.get('parsed', 0) for r in results)
    total_filtered = sum(r.get('filtered', 0) for r in results)
    total_saved = sum(r.get('saved', 0) for r in results)
    total_skipped = sum(r.get('skipped', 0) for r in results)
    
    summary = {
        'status': 'success',
        'timestamp': datetime.utcnow().isoformat(),
        'sources_crawled': len(results),
        'total_parsed': total_parsed,
        'total_filtered': total_filtered,
        'total_saved': total_saved,
        'total_skipped': total_skipped,
        'results': results
    }
    
    logger.info("=" * 80)
    logger.info(f"🎉 FULL NEWS CRAWL COMPLETED")
    logger.info(f"   Total parsed: {total_parsed}")
    logger.info(f"   Total filtered by OpenAI: {total_filtered}")
    logger.info(f"   Total saved to DB: {total_saved}")
    logger.info(f"   Total skipped (duplicates): {total_skipped}")
    logger.info("=" * 80)
    
    return summary


@shared_task(name="test_celery_task")
def test_celery_task():
    """
    Тестовая Celery задача для проверки работы
    """
    logger.info("✅ Test Celery task executed successfully!")
    return {"status": "success", "message": "Celery is working!"}

