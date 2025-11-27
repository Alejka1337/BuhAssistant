import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, getHeaders } from '../constants/api';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Помилка', 'Будь ласка, введіть email');
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректний email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Не вдалося відправити запит');
      }

      // Всегда показываем успех для безопасности
      Alert.alert(
        'Код відправлено',
        'Якщо акаунт з таким email існує, вам буде відправлено код для скидання пароля.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Переходим на экран ввода кода
              router.push({
                pathname: '/reset-password',
                params: { email },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Спробуйте ще раз');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Відновлення пароля',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
            color: Colors.textPrimary,
          },
          headerBackTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <MaterialIcons name="arrow-back-ios" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="lock-reset" size={80} color={Colors.primary} />
          <Text style={styles.title}>Забули пароль?</Text>
          <Text style={styles.subtitle}>
            Введіть ваш email і ми відправимо вам код для скидання пароля
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="email" 
              size={24} 
              color={Colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Отримати код</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <View style={styles.backSection}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>
              <MaterialIcons name="arrow-back" size={16} /> Повернутись до входу
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.cardBackground,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  backSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  backText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },
});

