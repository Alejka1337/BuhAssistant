/**
 * Secure Storage - платформо-независимое хранилище для токенов
 * iOS/Android: expo-secure-store
 * Web: localStorage (для совместимости)
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

/**
 * Сохранение значения
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      // Для веб используем localStorage
      localStorage.setItem(key, value);
    } else {
      // Для iOS/Android используем SecureStore
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    throw error;
  }
};

/**
 * Получение значения
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      // Для веб используем localStorage
      return localStorage.getItem(key);
    } else {
      // Для iOS/Android используем SecureStore
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

/**
 * Удаление значения
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      // Для веб используем localStorage
      localStorage.removeItem(key);
    } else {
      // Для iOS/Android используем SecureStore
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    throw error;
  }
};

/**
 * Очистка всех значений (для logout)
 */
export const clear = async (): Promise<void> => {
  try {
    if (isWeb) {
      // Для веб очищаем только наши ключи
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    } else {
      // Для iOS/Android удаляем через SecureStore
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

