/**
 * Сервис для работы с push-уведомлениями
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_ENDPOINTS } from '@/constants/api';
import { authenticatedFetch } from './authService';

// Конфигурация обработки уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Регистрация push-токена устройства
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token: string | null = null;

  console.log('🔔 [PushService] Device.isDevice:', Device.isDevice);
  if (!Device.isDevice) {
    console.log('⚠️ [PushService] Push notifications работают только на физических устройствах');
    return null;
  }

  try {
    console.log('🔔 [PushService] Checking existing permissions...');
    // Проверяем существующие разрешения
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('🔔 [PushService] Existing permission status:', existingStatus);
    let finalStatus = existingStatus;

    // Запрашиваем разрешение, если еще не предоставлено
    if (existingStatus !== 'granted') {
      console.log('🔔 [PushService] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 [PushService] Permission request result:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [PushService] Разрешение на push-уведомления не предоставлено');
      return null;
    }

    // Получаем push-токен
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('🔔 [PushService] Project ID:', projectId);
    console.log('🔔 [PushService] Getting Expo Push Token...');
    
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;

    console.log('✅ [PushService] Push token obtained:', token);

    // Для Android настраиваем канал уведомлений
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00BFA5',
      });
    }

    return token;
  } catch (error) {
    console.error('❌ [PushService] Ошибка регистрации push-токена:', error);
    return null;
  }
};

/**
 * Отправить push-токен на сервер
 */
export const sendPushTokenToBackend = async (pushToken: string): Promise<boolean> => {
  try {
    console.log('🔔 [PushService] Отправка push токена на бэкенд:', pushToken);
    console.log('🔔 [PushService] API endpoint:', API_ENDPOINTS.PUSH.REGISTER);
    
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        push_token: pushToken,
      }),
    });

    console.log('🔔 [PushService] Response status:', response.status);
    console.log('🔔 [PushService] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [PushService] Ошибка регистрации push токена. Status:', response.status, 'Response:', errorText);
      throw new Error(errorText || 'Не удалось зарегистрировать push-токен');
    }

    const data = await response.json();
    console.log('✅ [PushService] Push-токен успешно зарегистрирован:', data);
    return true;
  } catch (error: any) {
    console.error('❌ [PushService] Ошибка отправки push-токена на сервер:', error);
    return false;
  }
};

/**
 * Удалить push-токен с сервера (при logout)
 */
export const removePushTokenFromBackend = async (): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.DELETE_TOKEN, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Не удалось удалить push-токен');
      return false;
    }

    console.log('Push-токен удален с сервера');
    return true;
  } catch (error) {
    console.error('Ошибка удаления push-токена:', error);
    return false;
  }
};

/**
 * Получить настройки уведомлений пользователя
 */
export interface NotificationSettings {
  user_id: number;
  enable_deadline_notifications: boolean;
  enable_news_notifications: boolean;
  deadline_days_before: number[];
}

export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.SETTINGS, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Не удалось получить настройки');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Ошибка получения настроек уведомлений:', error);
    throw error;
  }
};

/**
 * Обновить настройки уведомлений
 */
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.SETTINGS, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Не удалось обновить настройки');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Ошибка обновления настроек уведомлений:', error);
    throw error;
  }
};

/**
 * Отправить тестовое уведомление
 */
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.TEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Тестове повідомлення',
        body: 'Це тестове push-повідомлення з eGlavBuh 🎉',
        data: {
          type: 'test',
        },
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Не вдалося відправити тестове повідомлення';
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } else {
          const text = await response.text();
          console.error('❌ Server error:', text.substring(0, 200));
          errorMessage = `Server error (${response.status})`;
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return true;
  } catch (error: any) {
    console.error('Ошибка отправки тестового уведомления:', error);
    throw error;
  }
};

