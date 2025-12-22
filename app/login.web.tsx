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
import { Typography, Spacing, BorderRadius } from '../constants/Theme';
import { useTheme } from '../contexts/ThemeContext';
import { useSEO } from '../hooks/useSEO';
import { PAGE_METAS } from '../utils/seo';

export default function LoginScreenWeb() {
  useSEO(PAGE_METAS.login);
  const { colors } = useTheme();
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
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="account-circle" size={80} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Вхід</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Увійдіть до свого облікового запису</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}>
              <MaterialIcons name="error-outline" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
              <MaterialIcons name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
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
            <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
              <MaterialIcons name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput, { color: colors.textPrimary }]}
                placeholder="Пароль"
                placeholderTextColor={colors.textMuted}
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
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }, isLoading && styles.loginButtonDisabled]}
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
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Забули пароль?</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderColor }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>або</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderColor }]} />
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={[styles.registerText, { color: colors.textMuted }]}>Ще немає облікового запису?</Text>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              disabled={isLoading}
            >
              <Text style={[styles.registerLink, { color: colors.primary }]}>Зареєструватися</Text>
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
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 56,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
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
    color: '#ffffff',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    padding: 8,
  },
  forgotPasswordText: {
    ...Typography.caption,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
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
  },
  registerLink: {
    ...Typography.caption,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    alignSelf: 'center',
  },
  skipButtonText: {
    ...Typography.caption,
  },
});

