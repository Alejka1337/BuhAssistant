/**
 * Login Screen - вход в систему (Web версия)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import PageWrapper from '../components/web/PageWrapper';
import MobileAuthLayout from '../components/web/MobileAuthLayout';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function LoginScreenWeb() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Если пользователь уже авторизован, перенаправляем на главную
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    if (!email.includes('@')) {
      setError('Будь ласка, введіть коректний email');
      return;
    }

    try {
      setIsLoading(true);
      const response = await login({ email, password });
      
      console.log('Login response:', response);
      
      // Проверяем, верифицирован ли пользователь
      if (!response.user.is_verified) {
        setError('Ваш email ще не підтверджено. Перевірте пошту та введіть код активації.');
        router.push({
          pathname: '/verify-email',
          params: { email },
        });
        return;
      }
      
      // Если верифицирован, перезагружаем страницу для обновления состояния
      console.log('Login successful, reloading page...');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Невірний email або пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <MobileAuthLayout title="Вхід">
      <PageWrapper showMobileNav={false}>
        <View style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="account-circle" size={80} color={Colors.primary} />
            <Text style={styles.title}>Вхід</Text>
            <Text style={styles.subtitle}>Увійдіть до свого облікового запису</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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
                onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
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

          {/* Skip Login */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Продовжити без входу</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </PageWrapper>
    </MobileAuthLayout>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  container: {
    width: '100%',
    maxWidth: 480,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    flex: 1,
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
    outlineStyle: 'none' as any,
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

