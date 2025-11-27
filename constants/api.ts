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
// Для разработки выберите один из вариантов:
const USE_NGROK = true; // Переключите на false для использования локального IP

export const API_URL = USE_NGROK
  ? 'https://e637d023274f.ngrok-free.app'  // ngrok - работает везде
  : 'http://192.168.0.102:8000';  // Локальный IP - только в одной сети

console.log('🔗 API_URL:', API_URL); // Для отладки

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
};

