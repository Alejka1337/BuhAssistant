/**
 * Google Sign In Button Component
 * Using expo-auth-session for simpler OAuth integration
 */
import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

// This is required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  text?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  text = 'Увійти через Google',
}: GoogleSignInButtonProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Get client IDs from app.json
  const iosClientId = Constants.expoConfig?.extra?.googleIosClientId;
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId;

  // ВАЖНО: Используем iOS Client ID напрямую (без Expo proxy)
  // Это работает лучше для физических устройств
  const clientId = iosClientId;

  // Generate redirect URI - используем native scheme приложения
  // Redirect URI для iOS (reverse domain notation согласно Google OAuth2)
  // Формат: com.googleusercontent.apps.REVERSED_CLIENT_ID:/oauthredirect
  // Берем iOS Client ID, удаляем '.apps.googleusercontent.com' и используем первую часть
  // iOS Client ID: 914514821616-47musasu3ster3fjvjlbehc8fdrdgbno.apps.googleusercontent.com
  // Reversed: 914514821616-47musasu3ster3fjvjlbehc8fdrdgbno
  const redirectUri = 'com.googleusercontent.apps.914514821616-47musasu3ster3fjvjlbehc8fdrdgbno:/oauthredirect';

  // Configure discovery document for Google OAuth
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // Log configuration for debugging
  useEffect(() => {
    console.log('Google OAuth Config:', {
      clientId,
      redirectUri,
      iosClientId,
      webClientId,
    });
  }, [clientId, redirectUri, iosClientId, webClientId]);

  // Create auth request with Code flow (для iOS Client ID)
  // iOS Client ID требует authorization code flow, а не implicit (IdToken) flow
  // Code exchange будет выполнен на backend
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId || '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.Code, // ✅ Code flow для iOS
      usePKCE: false, // iOS Client ID не требует PKCE
    },
    discovery
  );

  // Log request URL for debugging
  useEffect(() => {
    if (request) {
      console.log('Auth Request URL:', request.url);
      // Check if PKCE params are present (they shouldn't be for code flow without PKCE)
      if (request.url?.includes('code_challenge')) {
        console.warn('WARNING: PKCE parameters detected in request URL!');
      }
    }
  }, [request]);

  useEffect(() => {
    if (!clientId) {
      console.error('Google Client IDs not configured in app.json');
      Alert.alert(
        'Помилка конфігурації',
        'Google OAuth не налаштовано. Перевірте app.json'
      );
    } else {
      setIsConfigured(true);
    }
  }, [clientId]);

  // Handle success callback (wrapped in useCallback to avoid dependency issues)
  const handleSuccess = useCallback(async (code: string, usedClientId: string) => {
    try {
      // Передаем код И clientId который использовался для его получения
      await onSuccess(code, usedClientId);
    } catch (error: any) {
      console.error('Error processing Google login:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося завершити вхід');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [onSuccess, onError]);

  // Code flow doesn't need deep link handler - expo-auth-session handles it automatically

  // Handle OAuth response from expo-auth-session
  useEffect(() => {
    if (response?.type === 'success') {
      // For Code flow, Google returns authorization code
      const code = response.params.code;
      
      if (code) {
        console.log('Successfully received authorization code from Google');
        console.log('Used Client ID:', clientId);
        // Backend будет обменивать code на tokens
        // Отправляем code И clientId который использовался для получения кода
        handleSuccess(code, clientId || '');
      } else {
        console.error('No code in response params:', response.params);
        Alert.alert('Помилка', 'Не вдалося отримати код авторизації від Google');
        setIsSigningIn(false);
      }
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
      const errorMessage = response.error?.message || 'Не вдалося увійти через Google';
      Alert.alert('Помилка входу', errorMessage);
      setIsSigningIn(false);
      
      if (onError && response.error) {
        onError(new Error(response.error.message || 'Unknown error'));
      }
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      console.log('User cancelled Google Sign In');
      setIsSigningIn(false);
    }
  }, [response, handleSuccess, onError]);

  const handleGoogleSignIn = async () => {
    if (!isConfigured || !request) {
      Alert.alert('Помилка', 'Google Sign In ще не налаштовано');
      return;
    }

    try {
      setIsSigningIn(true);
      const result = await promptAsync();
      
      console.log('promptAsync result:', result);
      
      // Handle result directly (in case response hook doesn't catch it)
      if (result.type === 'success') {
        const code = result.params?.code;
        if (code) {
          console.log('Got authorization code from promptAsync result');
          await handleSuccess(code);
        } else {
          console.error('No code in promptAsync result:', result.params);
          Alert.alert('Помилка', 'Не вдалося отримати код авторизації від Google');
          setIsSigningIn(false);
        }
      } else if (result.type === 'error') {
        console.error('promptAsync error:', result.error);
        Alert.alert('Помилка входу', result.error?.message || 'Не вдалося увійти через Google');
        setIsSigningIn(false);
        if (onError && result.error) {
          onError(new Error(result.error.message || 'Unknown error'));
        }
      } else if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log('User cancelled Google Sign In (from promptAsync)');
        setIsSigningIn(false);
      }
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      Alert.alert('Помилка входу', 'Не вдалося відкрити Google Sign In');
      setIsSigningIn(false);
      
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || isSigningIn || !isConfigured) && styles.buttonDisabled,
      ]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isSigningIn || !isConfigured}
    >
      {isSigningIn ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <MaterialIcons name="login" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>{text}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4', // Google blue
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

