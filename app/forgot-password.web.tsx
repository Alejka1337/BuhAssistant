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
import PageWrapper from '../components/web/PageWrapper';
import MobileAuthLayout from '../components/web/MobileAuthLayout';
import { API_URL, getHeaders } from '../constants/api';
import { Typography, Spacing, BorderRadius } from '../constants/Theme';
import { useTheme } from '../contexts/ThemeContext';
import { useSEO } from '../hooks/useSEO';
import { PAGE_METAS } from '../utils/seo';

export default function ForgotPasswordScreenWeb() {
  useSEO(PAGE_METAS.forgotPassword);
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Будь ласка, введіть email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Будь ласка, введіть коректний email');
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

      setSuccess('Якщо акаунт з таким email існує, вам буде відправлено код для скидання пароля.');
      setTimeout(() => {
        router.push({
          pathname: '/reset-password',
          params: { email },
        });
      }, 2000);
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
    <MobileAuthLayout title="Відновлення паролю">
      <PageWrapper showMobileNav={false}>
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="lock-reset" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Забули пароль?</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Введіть ваш email і ми відправимо вам код для скидання пароля
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}15`, borderLeftColor: colors.error }]}>
                <MaterialIcons name="error-outline" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {success ? (
              <View style={[styles.successContainer, { backgroundColor: `${colors.primary}15`, borderLeftColor: colors.primary }]}>
                <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                <Text style={[styles.successText, { color: colors.primary }]}>{success}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={colors.textMuted} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  onKeyPress={handleKeyPress}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
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
                <Text style={[styles.backText, { color: colors.primary }]}>
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
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
  backSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  backText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});

