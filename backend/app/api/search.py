"""
Search API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.services.google_parser import search_multiple_sources
from app.models.search_log import SearchLog
from app.core.config import settings
import redis
import json
import hashlib
from typing import List

router = APIRouter()

# Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_cache_key(query: str, sources: List[str]) -> str:
    """Генерация ключа для кеша"""
    data = f"{query}:{','.join(sorted(sources))}"
    return f"search:{hashlib.md5(data.encode()).hexdigest()}"


@router.post("/", response_model=SearchResponse)
async def search(
    search_request: SearchRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Поиск по выбранным источникам с кешированием
    
    - **query**: Поисковый запрос (обязательно)
    - **sources**: Список доменов ['tax.gov.ua', 'zakon.rada.gov.ua'] или ['all']
    
    Returns:
        SearchResponse с результатами поиска
    """
    query = search_request.query.strip()
    sources = search_request.sources
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if not sources:
        raise HTTPException(status_code=400, detail="Sources cannot be empty")
    
    print(f"Search request: query='{query}', sources={sources}")
    
    # Проверяем кеш
    cache_key = get_cache_key(query, sources)
    
    try:
        cached_results = redis_client.get(cache_key)
        
        if cached_results:
            # Возвращаем из кеша
            results_data = json.loads(cached_results)
            results = [SearchResult(**r) for r in results_data]
            
            print(f"Returning {len(results)} cached results")
            
            return SearchResponse(
                query=query,
                sources=sources,
                results=results,
                total_results=len(results),
                cached=True
            )
    except Exception as cache_error:
        print(f"Cache read error (continuing without cache): {cache_error}")
    
    # Выполняем поиск
    try:
        print(f"Performing Google search for: {query}")
        results = await search_multiple_sources(query, sources)
        print(f"Search completed, got {len(results)} results")
    except Exception as e:
        print(f"Search error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Error performing search. Please try again later."
        )
    
    # Кешируем результаты на 1 час
    if results:
        try:
            results_json = [r.model_dump() for r in results]
            redis_client.setex(
                cache_key,
                3600,  # 1 час
                json.dumps(results_json, ensure_ascii=False)
            )
            print(f"Cached {len(results)} results with key: {cache_key}")
        except Exception as cache_error:
            print(f"Cache write error (continuing): {cache_error}")
    
    # Логируем запрос в БД
    try:
        search_log = SearchLog(
            query=query,
            sources=sources,
            results_count=len(results),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(search_log)
        db.commit()
        print(f"Logged search to database")
    except Exception as e:
        # Логирование не должно ломать основной запрос
        print(f"Error logging search: {e}")
        db.rollback()
    
    return SearchResponse(
        query=query,
        sources=sources,
        results=results,
        total_results=len(results),
        cached=False
    )


@router.get("/stats")
async def search_stats(db: Session = Depends(get_db)):
    """
    Статистика поисковых запросов
    
    Returns:
        Основные метрики по поиску
    """
    try:
        # Общее количество запросов
        total_searches = db.query(SearchLog).count()
        
        # Топ-10 популярных запросов
        from sqlalchemy import func
        popular_queries = (
            db.query(
                SearchLog.query,
                func.count(SearchLog.id).label('count')
            )
            .group_by(SearchLog.query)
            .order_by(func.count(SearchLog.id).desc())
            .limit(10)
            .all()
        )
        
        return {
            "total_searches": total_searches,
            "popular_queries": [
                {"query": q, "count": c}
                for q, c in popular_queries
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

