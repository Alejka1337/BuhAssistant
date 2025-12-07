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
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function ForgotPasswordScreenWeb() {
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
        <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="lock-reset" size={80} color={Colors.primary} />
              <Text style={styles.title}>Забули пароль?</Text>
              <Text style={styles.subtitle}>
                Введіть ваш email і ми відправимо вам код для скидання пароля
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {success ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
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
                  editable={!isLoading}
                  onKeyPress={handleKeyPress}
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    color: Colors.primary,
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
    fontSize: 16,
    fontFamily: Typography.body.fontFamily,
    color: Colors.textPrimary,
    outlineStyle: 'none' as any,
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

