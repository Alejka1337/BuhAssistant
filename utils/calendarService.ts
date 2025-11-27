/**
 * Сервис для работы с календарем бухгалтерских отчетов
 */
import { API_ENDPOINTS, getHeaders } from '../constants/api';

export interface CalendarEvent {
  date: string;
  type: string;
  title: string;
  who: string[]; // Теперь массив категорий
}

export interface CalendarResponse {
  total: number;
  events: CalendarEvent[];
}

export interface AvailablePeriod {
  month: number;
  year: number;
}

export interface AvailablePeriodsResponse {
  periods: AvailablePeriod[];
}

/**
 * Получить все календарные события
 * 
 * @returns Массив всех событий календаря
 * @throws Error если запрос не удался
 */
export const fetchAllCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const url = `${API_ENDPOINTS.CALENDAR}/`;
    console.log('📅 Fetching all calendar events...');
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('⚠️ Calendar file not found');
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: CalendarResponse = await response.json();
    console.log(`✅ Loaded ${data.total} calendar events`);
    
    return data.events;
  } catch (error) {
    console.error('❌ Error fetching calendar:', error);
    throw error;
  }
};

/**
 * Получить список доступных месяцев/годов в календаре
 * 
 * @returns Массив доступных периодов
 * @throws Error если запрос не удался
 */
export const fetchAvailablePeriods = async (): Promise<AvailablePeriod[]> => {
  try {
    const url = `${API_ENDPOINTS.CALENDAR}/available-months`;
    console.log('📅 Fetching available calendar periods...');
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: AvailablePeriodsResponse = await response.json();
    console.log(`✅ Found ${data.periods.length} available periods`);
    
    return data.periods;
  } catch (error) {
    console.error('❌ Error fetching available periods:', error);
    throw error;
  }
};


