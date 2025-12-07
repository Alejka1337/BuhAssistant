/**
 * Register Screen - регистрация
 */
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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    // Валидация
    if (!email || !password || !confirmPassword) {
      Alert.alert('Помилка', 'Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректний email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Помилка', 'Пароль повинен містити мінімум 6 символів');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Помилка', 'Паролі не співпадають');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Помилка', 'Ви повинні прийняти Умови використання для продовження');
      return;
    }

    try {
      setIsLoading(true);
      const response = await register({
        email,
        password,
        full_name: fullName || undefined,
      });
      
      // Проверяем, что ответ получен
      if (!response || !response.user) {
        throw new Error('Не вдалося отримати дані після реєстрації');
      }
      
      // Проверяем, что токен сохранился перед переходом
      const { getAccessToken } = await import('../utils/authService');
      const savedToken = await getAccessToken();
      console.log('Token after registration:', savedToken ? 'Saved' : 'NOT SAVED');
      
      // Автоматически принимаем Terms of Service после успешной регистрации
      try {
        const { API_ENDPOINTS, getHeaders } = await import('../constants/api');
        const { getAccessToken } = await import('../utils/authService');
        const token = await getAccessToken();
        
        if (token) {
          await fetch(`${API_ENDPOINTS.AUTH.ACCEPT_TERMS}`, {
            method: 'POST',
            headers: getHeaders({
              'Authorization': `Bearer ${token}`,
            }),
          });
        }
      } catch (termsError) {
        console.error('Failed to accept terms:', termsError);
        // Не останавливаем flow регистрации
      }
      
      // Если пользователь не верифицирован, перенаправляем на экран активации
      if (!response.user.is_verified) {
        // Небольшая задержка, чтобы токен успел сохраниться
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push({
          pathname: '/verify-email',
          params: { email },
        });
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert(
        'Помилка реєстрації',
        error.message || 'Не вдалося створити обліковий запис'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <MaterialIcons name="person-add" size={80} color={Colors.primary} />
          <Text style={styles.title}>Реєстрація</Text>
          <Text style={styles.subtitle}>Створіть новий обліковий запис</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name Input (Optional) */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="person" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Повне ім'я (необов'язково)"
              placeholderTextColor={Colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Пароль *"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
              disabled={isLoading}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Підтвердіть пароль *"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordToggle}
              disabled={isLoading}
            >
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <Text style={styles.passwordHint}>Пароль повинен містити мінімум 6 символів</Text>

          {/* Terms of Service Checkbox */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <MaterialIcons name="check" size={18} color={Colors.white} />}
            </View>
            <Text style={styles.termsText}>
              Я погоджуюсь з{' '}
              <Text
                style={styles.termsLink}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push('/terms-of-service');
                }}
              >
                Умовами використання
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              (isLoading || !acceptedTerms) && styles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={isLoading || !acceptedTerms}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Зареєструватися</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerLine} />
        </View>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Вже є обліковий запис?</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.loginLink}>Увійти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.md,
    padding: 4,
  },
  passwordHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -8,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    ...Typography.h4,
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBackground,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  loginText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  loginLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
});

