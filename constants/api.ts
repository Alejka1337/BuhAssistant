/**
 * API Configuration
 * 
 * Для локальной разработки используйте localhost
 * Для production замените на URL вашего сервера
 */

// Для iOS Simulator используйте localhost
// Для Android Emulator используйте 10.0.2.2
// Для реального устройства используйте IP вашего компьютера (например, 192.168.1.100)

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Конфигурация API URL

// Получаем API URL из app.json или используем production по умолчанию
const API_URL_FROM_CONFIG = Constants.expoConfig?.extra?.apiUrl;

// Debug logs
console.log('📋 Constants.expoConfig?.extra?.apiUrl:', Constants.expoConfig?.extra?.apiUrl);
console.log('📋 API_URL_FROM_CONFIG:', API_URL_FROM_CONFIG);

// export const API_URL = API_URL_FROM_CONFIG || 'https://api.eglavbuh.com.ua';
// export const API_URL = API_URL_FROM_CONFIG || 'https://90a8375ea3d8.ngrok-free.app'; // Локальный ngrok для тестирования
export const API_URL = API_URL_FROM_CONFIG || 'http://localhost:8000'; // Для тестирования без ngrok
console.log('🔗 API_URL (final):', API_URL); // Для отладки

// Базовые заголовки для всех запросов (включая обход ngrok warning)
export const getHeaders = (additionalHeaders?: Record<string, string>) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  ...additionalHeaders,
});

export const API_ENDPOINTS = {
  NEWS: `${API_URL}/api/news/`,
  NEWS_STATS: `${API_URL}/api/news/stats`,
  SEARCH: `${API_URL}/api/search/`,
  HEALTH: `${API_URL}/api/health`,
  CALENDAR: `${API_URL}/api/calendar`,
  AUTH: {
    REGISTER: `${API_URL}/api/auth/register`,
    LOGIN: `${API_URL}/api/auth/login`,
    REFRESH: `${API_URL}/api/auth/refresh`,
    ME: `${API_URL}/api/auth/me`,
    VERIFY: `${API_URL}/api/auth/verify`,
    RESEND_CODE: `${API_URL}/api/auth/resend-code`,
    GOOGLE: `${API_URL}/api/auth/google`,
    GOOGLE_URL: `${API_URL}/api/auth/google/url`,
    DELETE_ACCOUNT: `${API_URL}/api/auth/account`,
    ACCEPT_TERMS: `${API_URL}/api/auth/accept-terms`,
    HEALTH: `${API_URL}/api/auth/health`,
  },
  CONSULTATION: {
    SUBMIT: `${API_URL}/api/consultation/submit`,
    HEALTH: `${API_URL}/api/consultation/health`,
  },
  PROFILE: {
    ME: `${API_URL}/api/profile/me`,
    HEALTH: `${API_URL}/api/profile/health`,
  },
  PUSH: {
    REGISTER: `${API_URL}/api/push/register`,
    SETTINGS: `${API_URL}/api/push/settings`,
    TEST: `${API_URL}/api/push/test`,
    DELETE_TOKEN: `${API_URL}/api/push/token`,
  },
  REPORTS: {
    CREATE: `${API_URL}/api/reports`,
    MY: `${API_URL}/api/reports/my`,
  },
  BLOCKS: {
    CREATE: `${API_URL}/api/blocks`,
    DELETE: (userId: number) => `${API_URL}/api/blocks/${userId}`,
    LIST: `${API_URL}/api/blocks`,
    IDS: `${API_URL}/api/blocks/ids`,
  },
};

