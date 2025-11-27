/**
 * Обработчик push-уведомлений
 * Обрабатывает входящие уведомления в foreground и background
 */
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';

export const NotificationHandler: React.FC = () => {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Слушатель уведомлений, полученных в foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Уведомление получено в foreground:', notification);
      
      const { title, body } = notification.request.content;
      const data = notification.request.content.data;
      
      // Показываем alert для уведомлений в foreground (опционально)
      // По умолчанию уведомление уже отображается как banner
      if (data?.type === 'deadline') {
        console.log('Уведомление о дедлайне:', data);
      } else if (data?.type === 'news') {
        console.log('Уведомление о новости:', data);
      }
    });

    // Слушатель взаимодействия пользователя с уведомлением
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Пользователь нажал на уведомление:', response);
      
      const data = response.notification.request.content.data;
      
      // Навигация в зависимости от типа уведомления
      if (data?.type === 'deadline') {
        // Переход на календарь
        router.push('/(tabs)/calendar');
      } else if (data?.type === 'news' && data?.news_url) {
        // Переход на экран новостей или webview
        router.push({
          pathname: '/webview',
          params: { url: data.news_url },
        });
      } else if (data?.type === 'test') {
        Alert.alert(
          'Тестове повідомлення',
          'Push-уведомления работают правильно! 🎉'
        );
      }
    });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  // Компонент не рендерит UI
  return null;
};

export default NotificationHandler;

