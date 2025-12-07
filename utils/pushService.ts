/**
 * Сервис для работы с push-уведомлениями (анонимные + зарегистрированные пользователи)
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as secureStorage from './secureStorage';
import { API_URL } from '@/constants/api';

const PUSH_TOKEN_KEY = 'push_token';
const PUSH_TOKEN_REGISTERED_KEY = 'push_token_registered';

/**
 * Регистрация push уведомлений и получение токена
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permissions not granted');
      return null;
    }
    
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      token = tokenData.data;
      console.log('✅ Push token obtained:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('❌ Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Регистрация анонимного push токена на backend
 */
export async function registerAnonymousPushToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/push/register-anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        device_id: Device.osInternalBuildId || null,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Anonymous push token registered:', data);
      
      // Сохранить токен локально
      await secureStorage.setItem(PUSH_TOKEN_KEY, token);
      await secureStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, 'anonymous');
      
      return true;
    } else {
      console.error('❌ Failed to register anonymous push token:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering anonymous push token:', error);
    return false;
  }
}

/**
 * Привязать анонимный токен к пользователю при регистрации/логине
 */
export async function linkAnonymousTokenToUser(token: string, authToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/push/link-to-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        anonymous_token: token,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Anonymous token linked to user:', data);
      
      // Обновить статус регистрации
      await secureStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, 'user');
      
      return true;
    } else {
      console.warn('⚠️ Failed to link anonymous token (non-critical):', response.status);
      // Не критично, если токен не найден или уже привязан
      return false;
    }
  } catch (error) {
    console.error('❌ Error linking anonymous token:', error);
    return false;
  }
}

/**
 * Регистрация push токена для зарегистрированного пользователя
 */
export async function registerUserPushToken(token: string, authToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        push_token: token,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ User push token registered:', data);
      
      await secureStorage.setItem(PUSH_TOKEN_KEY, token);
      await secureStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, 'user');
      
      return true;
    } else {
      console.error('❌ Failed to register user push token:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering user push token:', error);
    return false;
  }
}

/**
 * Получить сохраненный push токен
 */
export async function getSavedPushToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting saved push token:', error);
    return null;
  }
}

/**
 * Проверить, зарегистрирован ли токен
 */
export async function isPushTokenRegistered(): Promise<string | null> {
  try {
    return await secureStorage.getItem(PUSH_TOKEN_REGISTERED_KEY);
  } catch (error) {
    console.error('Error checking push token registration:', error);
    return null;
  }
}

/**
 * Инициализация push уведомлений при запуске приложения
 * - Для незарегистрированных: регистрирует анонимный токен
 * - Для зарегистрированных: обновляет/привязывает токен
 */
export async function initializePushNotifications(
  isAuthenticated: boolean,
  authToken?: string
): Promise<void> {
  try {
    console.log('🔔 Initializing push notifications...', { isAuthenticated });
    
    // 1. Получить push токен от Expo
    const currentToken = await registerForPushNotificationsAsync();
    if (!currentToken) {
      console.log('❌ No push token obtained, skipping registration');
      return;
    }

    // 2. Проверить, изменился ли токен
    const savedToken = await getSavedPushToken();
    const isNewToken = savedToken !== currentToken;

    if (isNewToken) {
      console.log('🆕 New push token detected, registering...');
    }

    // 3. Зарегистрировать токен в зависимости от статуса аутентификации
    if (isAuthenticated && authToken) {
      // Пользователь авторизован
      console.log('👤 Registering push token for authenticated user');
      
      // Попытаться привязать анонимный токен (если был)
      if (savedToken && isNewToken) {
        await linkAnonymousTokenToUser(savedToken, authToken);
      }
      
      // Зарегистрировать текущий токен для пользователя
      await registerUserPushToken(currentToken, authToken);
    } else {
      // Пользователь не авторизован - регистрируем анонимный токен
      console.log('👻 Registering anonymous push token');
      
      if (isNewToken || !(await isPushTokenRegistered())) {
        await registerAnonymousPushToken(currentToken);
      } else {
        console.log('ℹ️ Anonymous token already registered');
      }
    }

    console.log('✅ Push notifications initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
  }
}

/**
 * Удалить push токен (при logout)
 */
export async function removePushToken(authToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/push/token`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      console.log('✅ Push token removed');
      
      // Очистить локальное хранилище
      await secureStorage.removeItem(PUSH_TOKEN_KEY);
      await secureStorage.removeItem(PUSH_TOKEN_REGISTERED_KEY);
      
      return true;
    } else {
      console.error('❌ Failed to remove push token:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error removing push token:', error);
    return false;
  }
}

/**
 * Настройка обработчиков push уведомлений
 */
export function setupNotificationHandlers() {
  // Обработчик полученных уведомлений (когда приложение на переднем плане)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

