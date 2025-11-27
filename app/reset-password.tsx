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
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, getHeaders } from '../constants/api';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Помилка', 'Будь ласка, заповніть всі поля');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Помилка', 'Код має бути 6-значним');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Помилка', 'Пароль має містити мінімум 6 символів');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Помилка', 'Паролі не співпадають');
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Не вдалося скинути пароль');
      }

      Alert.alert(
        'Успіх!',
        'Ваш пароль успішно змінено. Тепер ви можете увійти з новим паролем.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Спробуйте ще раз');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Новий пароль',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
            color: Colors.textPrimary,
          },
          headerBackTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <MaterialIcons name="arrow-back-ios" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
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
          <MaterialIcons name="vpn-key" size={80} color={Colors.primary} />
          <Text style={styles.title}>Новий пароль</Text>
          <Text style={styles.subtitle}>
            Введіть код з email та встановіть новий пароль
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Display */}
          <View style={styles.emailDisplay}>
            <MaterialIcons name="email" size={20} color={Colors.textSecondary} />
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Code Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="lock-outline" 
              size={24} 
              color={Colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Код з email (6 цифр)"
              placeholderTextColor={Colors.textMuted}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
          </View>

          {/* New Password Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="lock" 
              size={24} 
              color={Colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Новий пароль"
              placeholderTextColor={Colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons 
                name={showPassword ? 'visibility' : 'visibility-off'} 
                size={24} 
                color={Colors.textMuted} 
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="lock" 
              size={24} 
              color={Colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Підтвердіть пароль"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons 
                name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                size={24} 
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

        {/* Back Link */}
        <View style={styles.backSection}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>
              <MaterialIcons name="arrow-back" size={16} /> Повернутись назад
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  form: {
    width: '100%',
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  emailText: {
    ...Typography.caption,
    marginLeft: 8,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cardBackground,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    color: Colors.textPrimary,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
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

