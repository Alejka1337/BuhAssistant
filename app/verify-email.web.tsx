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
import { useAuth } from '../contexts/AuthContext';
import PageWrapper from '../components/web/PageWrapper';
import MobileAuthLayout from '../components/web/MobileAuthLayout';
import { verifyEmail, resendActivationCode } from '../utils/authService';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function VerifyEmailScreenWeb() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleVerify = async () => {
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Код має бути 6-значним');
      return;
    }

    setIsLoading(true);

    try {
      await verifyEmail(email, code);
      await refreshUser();
      
      setSuccess('Email успішно підтверджено!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Невірний код активації');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      await resendActivationCode(email);
      setSuccess('Новий код відправлено на вашу пошту');
    } catch (error: any) {
      setError(error.message || 'Не вдалося відправити код');
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !isLoading) {
      handleVerify();
    }
  };

  return (
    <MobileAuthLayout title="Верифікація">
      <PageWrapper showMobileNav={false}>
        <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="mark-email-unread" size={80} color={Colors.primary} />
              <Text style={styles.title}>Підтвердження Email</Text>
              <Text style={styles.subtitle}>
                Ми відправили код активації на
              </Text>
              <Text style={styles.email}>{email}</Text>
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
                  placeholder="Введіть 6-значний код"
                  placeholderTextColor={Colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                  onKeyPress={handleKeyPress}
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Підтвердити</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>Не отримали код?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
              >
                <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
                  {isResending ? 'Відправка...' : 'Відправити ще раз'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip Verification */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => window.location.href = '/'}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>Пропустити</Text>
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
    marginBottom: 4,
  },
  email: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
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
    letterSpacing: 4,
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
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  resendText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  resendLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.6,
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

