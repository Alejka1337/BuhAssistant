/**
 * Verify Email Screen - верификация email с помощью кода активации
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
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verifyEmail, resendActivationCode } from '../utils/authService';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  // Создаем refs для полей ввода
  const inputRefs = React.useRef<Array<TextInput | null>>([]);

  // Обработка изменения кода
  const handleCodeChange = (value: string, index: number) => {
    // Разрешаем только цифры
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Если вставлен код целиком (например, из буфера обмена)
      const digits = numericValue.slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      // Фокус на последнее заполненное поле - используем setTimeout для избежания проблем
      setTimeout(() => {
        const nextIndex = Math.min(index + digits.length, 5);
        if (nextIndex < 6) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 50);
      return;
    }
    
    const newCode = [...code];
    newCode[index] = numericValue;
    setCode(newCode);
    
    // Автоматический переход к следующему полю - с небольшой задержкой для iOS
    if (numericValue && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }
  };

  // Обработка удаления (backspace)
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 50);
    }
  };

  // Верификация кода
  const handleVerify = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      Alert.alert('Помилка', 'Будь ласка, введіть повний 6-значний код');
      return;
    }

    if (!email) {
      Alert.alert('Помилка', 'Email не знайдено');
      return;
    }

    try {
      setIsLoading(true);
      
      await verifyEmail(email, fullCode);
      await refreshUser();
      Alert.alert(
        'Успіх!',
        'Ваш email успішно підтверджено!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.message || 'Не вдалося підтвердити email. Перевірте код та спробуйте ще раз.';
      console.error('Verification error in UI:', {
        message: errorMessage,
        error: error
      });
      
      Alert.alert(
        'Помилка верифікації',
        errorMessage
      );
      // Очищаем код при ошибке
      setCode(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) {
      return;
    }

    try {
      setIsResending(true);
      await resendActivationCode(email);
      Alert.alert('Успіх', 'Новий код активації відправлено на вашу пошту');
      
      // Устанавливаем кулдаун на 60 секунд
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Не вдалося відправити код. Спробуйте пізніше.');
    } finally {
      setIsResending(false);
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
          <MaterialIcons name="email" size={80} color={Colors.primary} />
          <Text style={styles.title}>Підтвердження email</Text>
          <Text style={styles.subtitle}>
            Ми відправили код активації на{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Введіть 6-значний код:</Text>
          <View style={styles.codeInputs}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
            ))}
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || code.join('').length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Підтвердити</Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Не отримали код?</Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={isResending || resendCooldown > 0}
            style={styles.resendButton}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={[styles.resendLink, resendCooldown > 0 && styles.resendLinkDisabled]}>
                {resendCooldown > 0
                  ? `Відправити знову (${resendCooldown}с)`
                  : 'Відправити код знову'}
              </Text>
            )}
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
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  codeContainer: {
    marginBottom: 32,
  },
  codeLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  codeInput: {
    flex: 1,
    height: 64,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.cardBackground,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    ...Typography.h4,
    color: Colors.white,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  resendLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: Colors.textMuted,
  },
});

