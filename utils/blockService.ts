import { API_ENDPOINTS } from '@/constants/api';
import { authenticatedFetch } from './authService';

/**
 * Получить список ID заблокированных пользователей
 */
export const getBlockedUserIds = async (): Promise<number[]> => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.BLOCKS.IDS, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch blocked user IDs:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('📋 Raw blocked users response:', data);
    // Backend возвращает массив напрямую, не объект
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching blocked user IDs:', error);
    return [];
  }
};

