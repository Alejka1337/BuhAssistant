import { SOURCES } from '../constants/sources';
import { API_URL, getHeaders } from '../constants/api';

export interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
  date?: string | null;
}

/**
 * Формирует Google запрос с site: фильтром
 */
function buildGoogleQuery(query: string, domain: string): string {
  return `${query} site:${domain}`;
}

/**
 * Mock функция для парсинга Google результатов
 * TODO: Заменить на реальный API запрос (Google Custom Search API или SerpAPI)
 */
async function fetchGoogleResults(query: string, domain: string): Promise<SearchResult[]> {
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock данные с РЕАЛЬНЫМИ URL для тестирования WebView
  const mockDataByDomain: Record<string, SearchResult[]> = {
    'tax.gov.ua': [
      {
        title: 'Єдиний внесок на загальнообов\'язкове державне соціальне страхування',
        description: 'Докладна інформація про порядок нарахування та сплати єдиного внеску для підприємців та роботодавців.',
        url: 'https://tax.gov.ua/zakonodavstvo/ediniy-vnesok-na-zagalnoobovyazkove/',
        source: domain,
      },
      {
        title: 'Електронний кабінет платника податків',
        description: 'Інструкція з користування електронним кабінетом для подання звітності та взаємодії з ДПС.',
        url: 'https://tax.gov.ua/elektronnij-kabinet/',
        source: domain,
      },
      {
        title: 'Довідники ДПС України',
        description: 'Актуальні довідкові матеріали, форми звітності та нормативні документи.',
        url: 'https://tax.gov.ua/dovidniki/',
        source: domain,
      },
    ],
    'zakon.rada.gov.ua': [
      {
        title: 'Податковий кодекс України',
        description: 'Повний текст Податкового кодексу України з усіма змінами та доповненнями.',
        url: 'https://zakon.rada.gov.ua/laws/show/2755-17',
        source: domain,
      },
      {
        title: 'Закон про бухгалтерський облік',
        description: 'Закон України "Про бухгалтерський облік та фінансову звітність в Україні".',
        url: 'https://zakon.rada.gov.ua/laws/show/996-14',
        source: domain,
      },
      {
        title: 'Цивільний кодекс України',
        description: 'Цивільний кодекс України - основні положення для підприємців та юридичних осіб.',
        url: 'https://zakon.rada.gov.ua/laws/show/435-15',
        source: domain,
      },
    ],
    'buhgalter911.com.ua': [
      {
        title: 'Головна сторінка Бухгалтер 911',
        description: 'Актуальні новини, консультації та корисна інформація для бухгалтерів.',
        url: 'https://buhgalter911.com.ua/',
        source: domain,
      },
      {
        title: 'Новини для бухгалтера',
        description: 'Останні новини у сфері бухгалтерського обліку та оподаткування.',
        url: 'https://buhgalter911.com.ua/uk/news/',
        source: domain,
      },
      {
        title: 'Консультації бухгалтера',
        description: 'Професійні відповіді на питання з бухобліку, податків та звітності.',
        url: 'https://buhgalter911.com.ua/uk/consult/',
        source: domain,
      },
    ],
  };

  // Если для домена есть специфические данные, возвращаем их
  if (mockDataByDomain[domain]) {
    return mockDataByDomain[domain];
  }

  // Иначе возвращаем общие результаты с реальным URL главной страницы
  const mockResults: SearchResult[] = [
    {
      title: `Результат для "${query}" на ${domain}`,
      description: `Це детальна інформація про ${query}. Тут ви знайдете відповіді на ваші питання щодо бухгалтерського обліку та оподаткування.`,
      url: `https://${domain}`,
      source: domain,
    },
  ];

  return mockResults;
}

/**
 * Выполняет поиск по выбранным источникам через backend API
 * @param query - поисковый запрос пользователя
 * @param selectedSourceIds - массив ID выбранных источников
 * @returns массив результатов поиска
 */
export async function searchMultipleSources(
  query: string,
  selectedSourceIds: string[]
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/search/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        query: query,
        sources: selectedSourceIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Search API error:', error);
    throw error;
  }
}

/**
 * Реальная реализация с Google Custom Search API
 * Раскомментируйте и настройте, когда будете готовы к интеграции
 */
/*
const GOOGLE_API_KEY = 'YOUR_API_KEY';
const GOOGLE_CX = 'YOUR_SEARCH_ENGINE_ID';

async function fetchGoogleResultsReal(query: string, domain: string): Promise<SearchResult[]> {
  const searchQuery = buildGoogleQuery(query, domain);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&num=3`;

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.slice(0, 3).map((item: any) => ({
      title: item.title,
      description: item.snippet,
      url: item.link,
      source: domain,
    }));
  } catch (error) {
    console.error(`Error fetching results for ${domain}:`, error);
    return [];
  }
}
*/

