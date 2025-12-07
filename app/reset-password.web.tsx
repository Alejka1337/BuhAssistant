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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import PageWrapper from '../components/web/PageWrapper';
import MobileAuthLayout from '../components/web/MobileAuthLayout';
import { API_URL, getHeaders } from '../constants/api';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function ResetPasswordScreenWeb() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');

    if (!code || !newPassword || !confirmPassword) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    if (code.length !== 6) {
      setError('Код має бути 6-значним');
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль має містити мінімум 6 символів');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Не вдалося скинути пароль');
      }

      // Показываем успех и переходим на login
      alert('Пароль успішно змінено! Тепер ви можете увійти з новим паролем.');
      router.push('/login');
    } catch (error: any) {
      setError(error.message || 'Спробуйте ще раз');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <MobileAuthLayout title="Скидання паролю">
      <PageWrapper showMobileNav={false}>
        <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="vpn-key" size={80} color={Colors.primary} />
              <Text style={styles.title}>Новий пароль</Text>
              <Text style={styles.subtitle}>
                Введіть код з email та новий пароль
              </Text>
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
              {/* Email Display */}
              <View style={styles.emailDisplay}>
                <MaterialIcons name="email" size={20} color={Colors.primary} />
                <Text style={styles.emailText}>{email}</Text>
              </View>

              {/* Code Input */}
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="dialpad" 
                  size={20} 
                  color={Colors.textMuted} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="6-значний код"
                  placeholderTextColor={Colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                  onKeyPress={handleKeyPress}
                />
              </View>

              {/* New Password Input */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Новий пароль"
                  placeholderTextColor={Colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
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

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Підтвердіть новий пароль"
                  placeholderTextColor={Colors.textMuted}
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
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
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
                  <Text style={styles.buttonText}>Змінити пароль</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <View style={styles.backSection}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.backText}>
                  <MaterialIcons name="arrow-back" size={16} /> Повернутись до входу
                </Text>
              </TouchableOpacity>
            </View>
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
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  emailText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
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
    fontSize: 16,
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
  button: {
    backgroundColor: Colors.primary,
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
    color: Colors.white,
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

