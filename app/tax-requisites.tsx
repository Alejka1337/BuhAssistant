import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function TaxRequisitesScreen() {
  // Для мобильных версий показываем сообщение
  if (Platform.OS !== 'web') {
    return (
      <>
        <Stack.Screen 
          options={{
            title: 'Реквізити податкових органів',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <View style={styles.container}>
          <Text style={styles.message}>
            Ця функція доступна тільки у веб-версії додатку
          </Text>
          <Text style={styles.submessage}>
            Відкрийте eglavbuh.com.ua у браузері
          </Text>
        </View>
      </>
    );
  }

  // Для веб-версии этот файл не используется, так как есть tax-requisites.web.tsx
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  submessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
