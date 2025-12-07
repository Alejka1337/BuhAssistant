/**
 * Auth Context - управление состоянием авторизации
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { User, AuthResponse, LoginCredentials, RegisterData, UserProfileUpdate, login as apiLogin, register as apiRegister, logout as apiLogout, googleAuth as apiGoogleAuth, getCurrentUser, getAccessToken, fetchUserProfile, updateUserProfile, UserType, FOPGroup } from '../utils/authService';
import { initializePushNotifications, removePushToken } from '../utils/pushService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  googleLogin: (googleIdToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Проверка авторизации при запуске приложения
   */
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAccessToken();
      
      if (token) {
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Регистрируем push-токен при проверке авторизации
        if (userData.is_verified) {
          await registerPushToken();
        }
      }
    } catch (error) {
      // Тихо обрабатываем ошибку - это нормально для незалогиненного пользователя
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Инициализация push-уведомлений (поддерживает анонимных + зарегистрированных пользователей)
   */
  const registerPushToken = async (authToken?: string) => {
    // Push-уведомления работают только на iOS и Android
    if (Platform.OS === 'web') {
      console.log('Push notifications are disabled on web');
      return;
    }
    
    try {
      const isAuth = !!user;
      const token = authToken || await getAccessToken();
      
      await initializePushNotifications(isAuth, token || undefined);
    } catch (error) {
      // Тихо обрабатываем ошибку - push notifications не критичны
      console.error('Failed to initialize push notifications:', error);
    }
  };

  /**
   * Вход в систему
   */
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiLogin(credentials);
      setUser(response.user);
      
      // Привязываем анонимный токен к пользователю и регистрируем push
      if (response.user.is_verified) {
        await registerPushToken(response.access_token);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Регистрация
   */
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiRegister(data);
      setUser(response.user);
      
      // Привязываем анонимный токен к новому пользователю
      if (response.user.is_verified) {
        await registerPushToken(response.access_token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Авторизация через Google
   */
  const googleLogin = async (codeOrToken: string, clientId?: string) => {
    try {
      setIsLoading(true);
      // Теперь отправляем authorization code (не id_token) вместе с client_id
      const response: AuthResponse = await apiGoogleAuth(codeOrToken, true, clientId); // true = isCode
      setUser(response.user);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Выход из системы
   */
  const logout = async () => {
    try {
      const token = await getAccessToken();
      
      // Удаляем push-токен перед выходом
      if (token) {
        await removePushToken(token);
      }
      
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Обновление данных пользователя
   */
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user failed:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook для использования Auth Context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

