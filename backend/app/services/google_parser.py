"""
Сервис для парсинга Google результатов
"""
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import urllib.parse
import asyncio
import re
from app.schemas.search import SearchResult
from app.core.config import settings


async def parse_google_search(query: str, domain: str) -> List[SearchResult]:
    """
    Парсинг Google результатов для конкретного домена
    
    Args:
        query: Поисковый запрос
        domain: Домен для фильтрации (site:domain.com)
    
    Returns:
        Список SearchResult (топ-3)
    """
    # Формируем запрос в формате site:domain.com query
    search_query = f"site:{domain} {query}"
    encoded_query = urllib.parse.quote(search_query)
    url = f"https://www.google.com/search?q={encoded_query}&num=10"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status != 200:
                    print(f"Google returned status {response.status} for domain {domain}")
                    return []
                
                html = await response.text()
                
        soup = BeautifulSoup(html, 'lxml')
        results = []
        
        # DEBUG: Сохраняем HTML для отладки
        # with open(f'/tmp/google_response_{domain.replace(".", "_")}.html', 'w', encoding='utf-8') as f:
        #     f.write(html)
        # print(f"Saved HTML response to /tmp/google_response_{domain.replace('.', '_')}.html")
        
        # Ищем контейнеры результатов: div.MjjYud
        search_results = soup.find_all('div', class_='MjjYud', limit=10)
        
        print(f"Found {len(search_results)} MjjYud containers for {domain}")
        
        # Если не нашли, пробуем альтернативные селекторы
        if not search_results:
            print(f"Trying alternative selectors for {domain}")
            search_results = soup.find_all('div', class_='g', limit=10)
            print(f"Found {len(search_results)} 'g' class containers")
            
        if not search_results:
            # Проверяем наличие CAPTCHA
            if 'captcha' in html.lower() or 'recaptcha' in html.lower():
                print(f"⚠️ CAPTCHA detected for {domain}")
            else:
                print(f"⚠️ No search results containers found. First 500 chars of HTML:")
                print(html[:500])
        
        for result_container in search_results:
            try:
                # Title: h3.LC20lb MBeuO DKV0Md
                title_elem = result_container.find('h3', class_='LC20lb')
                if not title_elem:
                    # Альтернативный селектор
                    title_elem = result_container.find('h3')
                if not title_elem:
                    continue
                    
                title = title_elem.get_text(strip=True)
                
                # URL: a с классом или без
                link_elem = result_container.find('a', href=True)
                if not link_elem:
                    continue
                    
                link = link_elem['href']
                
                # Проверяем что это нормальный URL
                if not link.startswith('http'):
                    # Если URL относительный, пропускаем
                    if link.startswith('/'):
                        continue
                    # Пробуем найти в атрибуте data-href
                    link = link_elem.get('data-href', link)
                
                # Description и дата: div.VwiC3b yXK7lf
                desc_container = result_container.find('div', class_='VwiC3b')
                description = ""
                date = None
                
                if desc_container:
                    # Ищем дату: span.YrbPuc > span
                    date_elem = desc_container.find('span', class_='YrbPuc')
                    if date_elem:
                        date_span = date_elem.find('span')
                        if date_span:
                            date = date_span.get_text(strip=True)
                            # Удаляем дату из контейнера чтобы получить чистое описание
                            date_span.decompose()
                            if date_elem:
                                date_elem.decompose()
                    
                    # Получаем описание без даты
                    description = desc_container.get_text(strip=True)
                    # Убираем " — " в начале если есть
                    description = re.sub(r'^—\s*', '', description)
                
                if title and link:
                    results.append(SearchResult(
                        title=title,
                        description=description if description else f"Інформація з {domain}",
                        url=link,
                        source=domain,
                        date=date
                    ))
                    
                    print(f"Parsed result: {title[:50]}... from {domain}")
                    
                    # Собираем только топ-3
                    if len(results) >= 3:
                        break
                        
            except Exception as e:
                print(f"Error parsing result for {domain}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"Successfully parsed {len(results)} results for {domain}")
        return results[:3]
        
    except asyncio.TimeoutError:
        print(f"Timeout while searching {domain}")
        return []
    except Exception as e:
        print(f"Error searching {domain}: {e}")
        import traceback
        traceback.print_exc()
        return []


async def search_google_custom_api(query: str, domain: str) -> List[SearchResult]:
    """
    Поиск через Google Custom Search API
    
    Args:
        query: Поисковый запрос
        domain: Домен для фильтрации (site:domain.com)
    
    Returns:
        Список SearchResult (топ-3)
    """
    api_key = settings.GOOGLE_API_KEY
    cx = settings.GOOGLE_CX
    
    if not api_key or not cx:
        print("⚠️ Google API Key or CX not configured")
        return []
    
    # Формируем запрос с site: фильтром
    search_query = f"site:{domain} {query}"
    
    # Google Custom Search API endpoint
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': api_key,
        'cx': cx,
        'q': search_query,
        'num': 3,  # Максимум 3 результата
        'gl': 'ua',  # Географическая локализация - Украина
        'hl': 'uk',  # Язык интерфейса - украинский
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"Google API returned status {response.status}: {error_text}")
                    return []
                
                data = await response.json()
        
        results = []
        
        # Проверяем наличие результатов
        if 'items' not in data:
            print(f"No results found for {domain}")
            if 'error' in data:
                print(f"API Error: {data['error']}")
            return []
        
        # Парсим результаты
        for item in data['items']:
            title = item.get('title', '')
            snippet = item.get('snippet', '')
            link = item.get('link', '')
            
            # Пытаемся извлечь дату из metatags
            date = None
            if 'pagemap' in item:
                pagemap = item['pagemap']
                
                # Проверяем разные источники даты
                if 'metatags' in pagemap and len(pagemap['metatags']) > 0:
                    metatags = pagemap['metatags'][0]
                    date = (
                        metatags.get('article:modified_time') or
                        metatags.get('article:published_time') or
                        metatags.get('og:updated_time') or
                        metatags.get('date')
                    )
            
            if title and link:
                results.append(SearchResult(
                    title=title,
                    description=snippet if snippet else f"Інформація з {domain}",
                    url=link,
                    source=domain,
                    date=date
                ))
                
                print(f"Found result: {title[:50]}... from {domain}")
        
        print(f"Google API returned {len(results)} results for {domain}")
        return results[:3]
        
    except asyncio.TimeoutError:
        print(f"Timeout while searching {domain} via Google API")
        return []
    except Exception as e:
        print(f"Error searching {domain} via Google API: {e}")
        import traceback
        traceback.print_exc()
        return []


async def get_mock_results(query: str, domain: str) -> List[SearchResult]:
    """
    Временная mock-функция для демонстрации работы поиска
    Google блокирует прямой парсинг - нужно использовать официальный API или proxy
    """
    mock_data = {
        'tax.gov.ua': [
            SearchResult(
                title=f"Податкова звітність - {query}",
                description="Актуальна інформація щодо податкової звітності для різних категорій платників податків в Україні.",
                url="https://tax.gov.ua/baneryi/podatkova-zvitnist/",
                source=domain,
                date="15 жовт. 2024 р."
            ),
            SearchResult(
                title="Єдиний внесок: особливості звітності",
                description="Детальна інформація про порядок нарахування та сплати єдиного внеску на загальнообов'язкове державне соціальне страхування.",
                url="https://tax.gov.ua/zakonodavstvo/ediniy-vnesok-na-zagalnoobovyazkove-/",
                source=domain,
                date="3 квіт. 2025 р."
            ),
            SearchResult(
                title="Податковий календар 2025",
                description="Терміни подання звітності та сплати податків для фізичних осіб-підприємців та юридичних осіб у 2025 році.",
                url="https://tax.gov.ua/kalendar-podatkiv/",
                source=domain,
                date="1 січ. 2025 р."
            ),
        ],
        'zakon.rada.gov.ua': [
            SearchResult(
                title=f"Законодавство України - {query}",
                description="Нормативно-правова база щодо оподаткування та бухгалтерського обліку в Україні.",
                url="https://zakon.rada.gov.ua/laws/show/2755-17",
                source=domain,
                date="10 лют. 2025 р."
            ),
        ],
        'buhgalter911.com.ua': [
            SearchResult(
                title=f"Практичний порадник - {query}",
                description="Детальні інструкції та роз'яснення для бухгалтерів щодо ведення обліку та звітності.",
                url="https://buhgalter911.com.ua/news/",
                source=domain,
                date="20 лют. 2025 р."
            ),
        ],
    }
    
    return mock_data.get(domain, [])


async def search_multiple_sources(query: str, domains: List[str]) -> List[SearchResult]:
    """
    Поиск по нескольким источникам параллельно
    
    Args:
        query: Поисковый запрос
        domains: Список доменов или ['all']
    
    Returns:
        Объединенный список результатов
    """
    # Список всех доступных доменов
    all_domains = [
        'tax.gov.ua',
        'zakon.rada.gov.ua',
        'buhgalter911.com.ua',
        'ligazakon.net',
        'dtkt.ua',
        'minfin.gov.ua',
        'diia.gov.ua'
    ]
    
    # Если выбрано "all", ищем по всем источникам
    if 'all' in domains:
        domains_to_search = all_domains
    else:
        # Фильтруем только валидные домены
        domains_to_search = [d for d in domains if d in all_domains]
    
    if not domains_to_search:
        print(f"No valid domains to search. Provided: {domains}")
        return []
    
    print(f"Searching {len(domains_to_search)} domains: {domains_to_search}")
    
    # Проверяем наличие Google API credentials
    api_key = settings.GOOGLE_API_KEY
    cx = settings.GOOGLE_CX
    USE_GOOGLE_API = bool(api_key and cx)
    
    if USE_GOOGLE_API:
        print("✅ Using Google Custom Search API")
        
        # Используем официальный Google API
        tasks = [search_google_custom_api(query, domain) for domain in domains_to_search]
        results_arrays = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_results = []
        for i, results in enumerate(results_arrays):
            if isinstance(results, list):
                all_results.extend(results)
                print(f"Domain {domains_to_search[i]} returned {len(results)} results via API")
            elif isinstance(results, Exception):
                print(f"Domain {domains_to_search[i]} failed with error: {results}")
        
        print(f"Total results collected via Google API: {len(all_results)}")
        return all_results
    else:
        print("⚠️ Using MOCK data - Google API credentials not configured")
        print("   Set GOOGLE_API_KEY and GOOGLE_CX in .env to use real search")
        
        # Fallback на mock данные
        tasks = [get_mock_results(query, domain) for domain in domains_to_search]
        results_arrays = await asyncio.gather(*tasks)
        
        all_results = []
        for i, results in enumerate(results_arrays):
            if results:
                all_results.extend(results)
                print(f"Domain {domains_to_search[i]} returned {len(results)} mock results")
        
        print(f"Total mock results collected: {len(all_results)}")
        return all_results

