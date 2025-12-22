import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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

export default function RegisterScreenWeb() {
  useSEO(PAGE_METAS.register);
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    if (!email.includes('@')) {
      setError('Будь ласка, введіть коректний email');
      return;
    }

    if (password.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    try {
      setIsLoading(true);
      const response = await register({
        email,
        password,
        full_name: fullName || undefined,
      });
      
      if (!response || !response.user) {
        throw new Error('Не вдалося отримати дані після реєстрації');
      }
      
      if (!response.user.is_verified) {
        router.push({
          pathname: '/verify-email',
          params: { email },
        });
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      setError(error.message || 'Не вдалося створити обліковий запис');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !isLoading) {
      handleRegister();
    }
  };

  return (
    <MobileAuthLayout title="Реєстрація">
      <PageWrapper showMobileNav={false}>
      <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="person-add" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Реєстрація</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Створіть обліковий запис</Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}15`, borderLeftColor: colors.error }]}>
                <MaterialIcons name="error-outline" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {/* Full Name Input */}
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
                <MaterialIcons name="person" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Повне ім'я (необов'язково)"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
                  onKeyPress={handleKeyPress}
                />
              </View>

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

              {/* Confirm Password Input */}
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
                <MaterialIcons name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput, { color: colors.textPrimary }]}
                  placeholder="Підтвердіть пароль"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onKeyPress={handleKeyPress}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  disabled={isLoading}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Зареєструватися</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Text style={[styles.loginText, { color: colors.textMuted }]}>Вже є обліковий запис?</Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                disabled={isLoading}
              >
                <Text style={[styles.loginLink, { color: colors.primary }]}>Увійти</Text>
              </TouchableOpacity>
            </View>

            {/* Skip Registration */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.replace('/(tabs)')}
              disabled={isLoading}
            >
              <Text style={[styles.skipButtonText, { color: colors.textMuted }]}>Продовжити без реєстрації</Text>
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
    fontSize: 16,
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
  button: {
    borderRadius: BorderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.h4,
    color: '#ffffff',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  loginText: {
    ...Typography.caption,
  },
  loginLink: {
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

