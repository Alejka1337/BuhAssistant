/**
 * Login Screen - вход в систему
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
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const insets = useSafeAreaInsets();

  const handleGoogleSignIn = async (code: string, clientId: string) => {
    try {
      await googleLogin(code);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Помилка входу через Google', error.message || 'Спробуйте ще раз');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Помилка', 'Будь ласка, заповніть всі поля');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректний email');
      return;
    }

    try {
      setIsLoading(true);
      const response = await login({ email, password });
      
      // Проверяем, верифицирован ли пользователь
      if (!response.user.is_verified) {
        // Перенаправляем на экран верификации
        Alert.alert(
          'Підтвердження email',
          'Ваш email ще не підтверджено. Бажаєте отримати новий код активації?',
          [
            {
              text: 'Ні, у мене є код',
              onPress: () => {
                router.push({
                  pathname: '/verify-email',
                  params: { email },
                });
              },
            },
            {
              text: 'Так, відправити код',
              onPress: async () => {
                try {
                  const { resendActivationCode } = await import('../utils/authService');
                  await resendActivationCode(email);
                  Alert.alert(
                    'Успіх',
                    'Новий код активації відправлено на вашу пошту',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          router.push({
                            pathname: '/verify-email',
                            params: { email },
                          });
                        },
                      },
                    ]
                  );
                } catch (error: any) {
                  Alert.alert('Помилка', error.message || 'Не вдалося відправити код');
                  // Все равно перенаправляем на экран верификации
                  router.push({
                    pathname: '/verify-email',
                    params: { email },
                  });
                }
              },
            },
          ]
        );
        return;
      }
      
      // Если верифицирован, переходим на главный экран
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Помилка входу', error.message || 'Невірний email або пароль');
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
          <MaterialIcons name="account-circle" size={80} color={Colors.primary} />
          <Text style={styles.title}>Вхід</Text>
          <Text style={styles.subtitle}>Увійдіть до свого облікового запису</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
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
              placeholder="Пароль"
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

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Увійти</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            disabled={isLoading}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Забули пароль?</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>або</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign In - ВРЕМЕННО ОТКЛЮЧЕНО */}
        {/* TODO: Google OAuth требует Firebase или Web View для iOS */}
        {/* Проблема: Web Client ID не принимает custom URI schemes */}
        {/* Решение: Интеграция с Firebase Auth или использование WebView flow */}
        {/* 
        <GoogleSignInButton
          onSuccess={handleGoogleSignIn}
          disabled={isLoading}
        />
        */}

        {/* Register Link */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Ще немає облікового запису?</Text>
          <TouchableOpacity
            onPress={() => router.push('/register')}
            disabled={isLoading}
          >
            <Text style={styles.registerLink}>Зареєструватися</Text>
          </TouchableOpacity>
        </View>

        {/* Skip Login (for testing) */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Продовжити без входу</Text>
        </TouchableOpacity>
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
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    color: Colors.textPrimary,
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.md,
    padding: 4,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...Typography.h4,
    color: Colors.white,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    padding: 8,
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBackground,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  registerText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  registerLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    alignSelf: 'center',
  },
  skipButtonText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});

