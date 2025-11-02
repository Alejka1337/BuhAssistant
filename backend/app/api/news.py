"""
News API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.models.news import News
from app.services.minfin_crawler import crawl_minfin
from app.services.news_filter import filter_relevant_news
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

