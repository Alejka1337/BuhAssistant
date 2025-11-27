"""
News API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.models.news import News
from app.services.minfin_crawler import crawl_minfin
from app.services.tax_gov_ua_crawler import crawl_tax_gov_ua
from app.services.liga_net_crawler import crawl_liga_net
from app.services.buhgalter911_crawler import crawl_buhgalter911
from app.services.news_filter import filter_relevant_news
from app.crawlers.tax_gov_ua_playwright import crawl_tax_gov_ua as crawl_tax_gov_ua_playwright
from app.crawlers.diia_gov_ua_playwright import crawl_diia_gov_ua as crawl_diia_gov_ua_playwright
from app.crawlers.dtkt_crawler import crawl_dtkt
from typing import List, Optional
from datetime import datetime

router = APIRouter()


@router.post("/crawl/minfin")
async def crawl_minfin_news(db: Session = Depends(get_db)):
    """
    Запустить краулер для minfin.com.ua
    
    Парсит новости с /ua/articles/ и /ua/news/
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    print("🕷️ Starting Minfin crawler...")
    
    try:
        # Шаг 1: Парсинг
        articles = await crawl_minfin()
        
        if not articles:
            return {
                "status": "success",
                "message": "No new articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        articles_dict = [a.to_dict() for a in articles]
        filtered_articles = await filter_relevant_news(articles_dict)
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),  # Используем summary как content
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],  # JSON array
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow(),  # У Minfin нет даты, используем текущую
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"Crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ Crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/tax-gov-ua")
async def crawl_tax_gov_ua_news(db: Session = Depends(get_db)):
    """
    Запустить краулер для tax.gov.ua
    
    Парсит новости с https://tax.gov.ua/media-tsentr/novini/
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    try:
        print("🕷️ Starting Tax.gov.ua crawler...")
        
        # Шаг 1: Парсинг новостей
        articles = await crawl_tax_gov_ua()
        print(f"📰 Crawled {len(articles)} articles")
        
        if not articles:
            return {
                "status": "warning",
                "message": "No articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0,
                "skipped": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        articles_dict = [a.to_dict() for a in articles]
        filtered_articles = await filter_relevant_news(articles_dict)
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow(),
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"Crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ Crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/liga-net")
async def crawl_liga_net_news(db: Session = Depends(get_db)):
    """
    Запустить краулер для liga.net
    
    Парсит новости с https://news.liga.net/ua
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    try:
        print("🕷️ Starting Liga.net crawler...")
        
        # Шаг 1: Парсинг новостей
        articles = await crawl_liga_net()
        print(f"📰 Crawled {len(articles)} articles")
        
        if not articles:
            return {
                "status": "warning",
                "message": "No articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0,
                "skipped": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        articles_dict = [a.to_dict() for a in articles]
        filtered_articles = await filter_relevant_news(articles_dict)
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', article.get('categories', ['загальне'])[0] if isinstance(article.get('categories'), list) else 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow(),
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"Crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ Crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/tax-gov-ua-playwright")
async def crawl_tax_gov_ua_playwright_news(db: Session = Depends(get_db)):
    """
    Запустить Playwright краулер для tax.gov.ua
    
    Парсит новости с https://tax.gov.ua/media-tsentr/novini/ используя браузер
    Обходит CDN защиту через Playwright
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    try:
        print("🕷️ Starting Tax.gov.ua Playwright crawler...")
        
        # Шаг 1: Парсинг новостей через Playwright
        articles = await crawl_tax_gov_ua_playwright()
        print(f"📰 Crawled {len(articles)} articles with Playwright")
        
        if not articles:
            return {
                "status": "warning",
                "message": "No articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0,
                "skipped": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        filtered_articles = await filter_relevant_news(articles)
        print(f"✅ Filtered {len(filtered_articles)} relevant articles")
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
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
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article.get('source', 'tax.gov.ua'),
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=published_at,
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"Playwright crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ Playwright crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Playwright crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/diia-gov-ua-playwright")
async def crawl_diia_gov_ua_playwright_news(db: Session = Depends(get_db)):
    """
    Запустить Playwright краулер для diia.gov.ua
    
    Парсит новости с https://diia.gov.ua/news используя браузер
    Обходит SPA и динамическую загрузку контента
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    try:
        print("🕷️ Starting Diia.gov.ua Playwright crawler...")
        
        # Шаг 1: Парсинг новостей через Playwright
        articles = await crawl_diia_gov_ua_playwright()
        print(f"📰 Crawled {len(articles)} articles from Diia with Playwright")
        
        if not articles:
            return {
                "status": "warning",
                "message": "No articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0,
                "skipped": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        filtered_articles = await filter_relevant_news(articles)
        print(f"✅ Filtered {len(filtered_articles)} relevant articles for business/FOP")
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
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
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article.get('source', 'diia.gov.ua'),
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=published_at,
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"Diia Playwright crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ Diia Playwright crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Diia Playwright crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/dtkt")
async def crawl_dtkt_news(db: Session = Depends(get_db)):
    """
    Запустить краулер для dtkt.ua (Дебет-Кредит)
    
    Парсит новости с https://news.dtkt.ua/?sort=main
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    try:
        print("🕷️ Starting dtkt.ua crawler...")
        
        # Шаг 1: Парсинг новостей
        articles = await crawl_dtkt()
        print(f"📰 Crawled {len(articles)} articles from dtkt.ua")
        
        if not articles:
            return {
                "status": "warning",
                "message": "No articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0,
                "skipped": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        filtered_articles = await filter_relevant_news(articles)
        print(f"✅ Filtered {len(filtered_articles)} relevant articles")
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
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
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article.get('source', 'dtkt.ua'),
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=published_at,
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"dtkt.ua crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ dtkt.ua crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ dtkt.ua crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/buhgalter911")
async def crawl_buhgalter911_news(db: Session = Depends(get_db)):
    """
    Запустить краулер для buhgalter911.com
    
    Парсит новости с https://buhgalter911.com/uk/news/
    Фильтрует через OpenAI API
    Сохраняет в БД
    """
    try:
        print("🕷️ Starting Buhgalter911.com crawler...")
        
        # Шаг 1: Парсинг новостей
        articles = await crawl_buhgalter911()
        print(f"📰 Crawled {len(articles)} articles")
        
        if not articles:
            return {
                "status": "warning",
                "message": "No articles found",
                "parsed": 0,
                "filtered": 0,
                "saved": 0,
                "skipped": 0
            }
        
        # Шаг 2: Фильтрация через OpenAI
        articles_dict = [a.to_dict() for a in articles]
        filtered_articles = await filter_relevant_news(articles_dict)
        
        # Шаг 3: Сохранение в БД
        saved_count = 0
        skipped_count = 0
        
        for article in filtered_articles:
            # Проверяем, нет ли уже такой статьи
            existing = db.query(News).filter(News.url == article['url']).first()
            
            if existing:
                print(f"  ⏭️ Skipping duplicate: {article['title'][:50]}...")
                skipped_count += 1
                continue
            
            # Создаем новую запись
            news_item = News(
                title=article['title'],
                url=article['url'],
                source=article['source'],
                content=article.get('summary', article['title']),
                summary=article.get('summary', article['title']),
                categories=[article.get('category', article.get('categories', ['загальне'])[0] if isinstance(article.get('categories'), list) else 'загальне')],
                target_audience=article.get('target_audience', []),
                published_at=datetime.utcnow(),
            )
            
            db.add(news_item)
            saved_count += 1
            print(f"  💾 Saved: {article['title'][:50]}...")
        
        db.commit()
        
        result = {
            "status": "success",
            "message": f"Crawler finished successfully",
            "parsed": len(articles),
            "filtered": len(filtered_articles),
            "saved": saved_count,
            "skipped": skipped_count
        }
        
        print(f"✅ Crawler finished: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Crawler error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_news(
    category: Optional[str] = Query(None, description="Категория новостей"),
    target_audience: Optional[str] = Query(None, description="Целевая аудитория (ФОП, ЮО, бухгалтери)"),
    limit: int = Query(20, ge=1, le=100, description="Количество новостей"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации"),
    db: Session = Depends(get_db)
):
    """
    Получить список новостей с фильтрацией
    
    - **category**: Фильтр по категории (податки, звітність, законодавство, ЄСВ, зарплата, бухоблік)
    - **target_audience**: Фильтр по аудитории (ФОП, ЮО, бухгалтери)
    - **limit**: Количество новостей (по умолчанию 20)
    - **offset**: Смещение для пагинации
    """
    query = db.query(News).filter(News.is_published == True)
    
    if category:
        # PostgreSQL JSON array contains
        query = query.filter(News.categories.contains([category]))
    
    if target_audience:
        # PostgreSQL JSON array contains
        query = query.filter(News.target_audience.contains([target_audience]))
    
    # Сортируем по дате публикации (новые первые)
    query = query.order_by(desc(News.published_at))
    
    # Пагинация
    total = query.count()
    news_items = query.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": item.id,
                "title": item.title,
                "url": item.url,
                "source": item.source,
                "categories": item.categories,
                "target_audience": item.target_audience,
                "summary": item.summary,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in news_items
        ]
    }


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """
    Получить список всех категорий новостей
    """
    # Получаем все новости
    news_items = db.query(News).filter(News.is_published == True).all()
    
    # Подсчитываем категории вручную, так как это JSON поле
    category_counts = {}
    for item in news_items:
        if item.categories:
            for cat in item.categories:
                category_counts[cat] = category_counts.get(cat, 0) + 1
    
    # Сортируем по количеству
    sorted_categories = sorted(
        category_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    return {
        "categories": [
            {"name": cat, "count": count}
            for cat, count in sorted_categories
        ]
    }


@router.get("/stats")
async def news_stats(db: Session = Depends(get_db)):
    """
    Статистика по новостям
    """
    from sqlalchemy import func
    
    total_news = db.query(News).count()
    published_news = db.query(News).filter(News.is_published == True).count()
    
    # По источникам
    by_source = (
        db.query(News.source, func.count(News.id).label('count'))
        .group_by(News.source)
        .all()
    )
    
    # По категориям (вручную, так как это JSON)
    news_items = db.query(News).filter(News.is_published == True).all()
    category_counts = {}
    for item in news_items:
        if item.categories:
            for cat in item.categories:
                category_counts[cat] = category_counts.get(cat, 0) + 1
    
    # Топ-10 категорий
    top_categories = sorted(
        category_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    return {
        "total_news": total_news,
        "published_news": published_news,
        "by_source": [
            {"source": source, "count": count}
            for source, count in by_source
        ],
        "top_categories": [
            {"category": cat, "count": count}
            for cat, count in top_categories
        ]
    }

