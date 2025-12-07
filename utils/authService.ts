/**
 * Auth Service - работа с авторизацией
 */
import { API_ENDPOINTS, getHeaders } from '../constants/api';
import * as secureStorage from './secureStorage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Enum для типов пользователя (совпадает с backend)
export enum UserType {
  FOP = "fop",
  LEGAL_ENTITY = "legal_entity",
  ACCOUNTANT = "accountant",
  INDIVIDUAL = "individual",
}

// Enum для групп ФОП (совпадает с backend)
export enum FOPGroup {
  GROUP_1 = "1",
  GROUP_2 = "2",
  GROUP_3 = "3",
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  user_type: UserType | null; // Используем UserType enum
  fop_group: FOPGroup | null; // Используем FOPGroup enum
  tax_system: string | null;
  is_active: boolean;
  is_verified: boolean;
  accepted_terms: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface UserProfileUpdate {
  full_name?: string;
  user_type?: UserType; // Используем UserType enum
  fop_group?: FOPGroup; // Используем FOPGroup enum
  tax_system?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

/**
 * Сохранение токенов
 */
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await secureStorage.setItem(TOKEN_KEY, accessToken);
    await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

/**
 * Получение access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await secureStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Получение refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await secureStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Удаление токенов
 */
export const deleteTokens = async (): Promise<void> => {
  try {
    await secureStorage.removeItem(TOKEN_KEY);
    await secureStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error deleting tokens:', error);
  }
};

/**
 * Регистрация нового пользователя
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const authData: AuthResponse = await response.json();
    console.log('Registration successful, saving tokens...');
    await saveTokens(authData.access_token, authData.refresh_token);
    
    // Проверяем, что токены сохранились
    const savedToken = await getAccessToken();
    if (savedToken) {
      console.log('Token saved successfully:', savedToken.substring(0, 20) + '...');
    } else {
      console.error('Token was not saved!');
    }
    
    return authData;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Вход в систему
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const authData: AuthResponse = await response.json();
    await saveTokens(authData.access_token, authData.refresh_token);
    return authData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Получение информации о текущем пользователе
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await authenticatedFetch(`${API_ENDPOINTS.AUTH.ME}`);

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return await response.json();
};

/**
 * Обновление access token с помощью refresh token
 */
export const refreshAccessToken = async (): Promise<AuthResponse> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await fetch(`${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const authData: AuthResponse = await response.json();
    await saveTokens(authData.access_token, authData.refresh_token);
    return authData;
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};

/**
 * Выход из системы
 */
export const logout = async (): Promise<void> => {
  await deleteTokens();
};

/**
 * Авторизация через Google (отправка Google ID token на backend)
 */
export const googleAuth = async (
  codeOrToken: string, 
  isCode: boolean = false,
  clientId?: string
): Promise<AuthResponse> => {
  try {
    const body = isCode 
      ? { 
          code: codeOrToken, 
          redirect_uri: 'com.googleusercontent.apps.914514821616-47musasu3ster3fjvjlbehc8fdrdgbno:/oauthredirect',
          client_id: clientId // Передаем Client ID который использовался для получения кода
        }
      : { token: codeOrToken };
    
    const response = await fetch(`${API_ENDPOINTS.AUTH.GOOGLE}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Google authentication failed');
    }

    const authData: AuthResponse = await response.json();
    await saveTokens(authData.access_token, authData.refresh_token);
    return authData;
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

/**
 * Верификация email с помощью кода активации
 */
export const verifyEmail = async (email: string, code: string): Promise<AuthResponse> => {
  try {
    console.log('Verifying email:', email);
    console.log('API endpoint:', API_ENDPOINTS.AUTH.VERIFY);

    const response = await fetch(`${API_ENDPOINTS.AUTH.VERIFY}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, code }),
    });
    
    console.log('Response status:', response.status);

    if (!response.ok) {
      let errorDetail = 'Email verification failed';
      try {
        const error = await response.json();
        errorDetail = error.detail || error.message || errorDetail;
        console.error('Verification error response:', {
          status: response.status,
          statusText: response.statusText,
          detail: errorDetail,
        });
      } catch (parseError) {
        const text = await response.text();
        console.error('Failed to parse error response:', {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        errorDetail = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    const authData: AuthResponse = await response.json();
    await saveTokens(authData.access_token, authData.refresh_token);
    return authData;
  } catch (error: any) {
    console.error('Email verification error:', error);
    throw new Error(error?.message || 'Не вдалося підтвердити email. Спробуйте ще раз.');
  }
};

/**
 * Повторная отправка кода активации на email
 */
export const resendActivationCode = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH.RESEND_CODE}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resend activation code');
    }
  } catch (error) {
    console.error('Resend activation code error:', error);
    throw error;
  }
};

/**
 * Получение профиля пользователя
 */
export const fetchUserProfile = async (): Promise<User> => {
  try {
    const response = await authenticatedFetch(`${API_ENDPOINTS.PROFILE.ME}`);

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch user profile error:', error);
    throw error;
  }
};

/**
 * Обновление профиля пользователя
 */
export const updateUserProfile = async (data: UserProfileUpdate): Promise<User> => {
  try {
    const response = await authenticatedFetch(`${API_ENDPOINTS.PROFILE.ME}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

/**
 * Wrapper для fetch с автоматическим обновлением токена
 * Используйте эту функцию вместо fetch для защищённых endpoint'ов
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No access token');
    }

    console.log('🔐 authenticatedFetch:', url.substring(url.lastIndexOf('/') + 1));

    // Добавляем токен к headers
    const headers = {
      ...getHeaders(),
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    };

    // Первая попытка запроса
    let response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📡 Response status: ${response.status}`);

    // Если получили 401 - токен истёк, пробуем обновить
    if (response.status === 401) {
      console.log('⚠️ Token expired, attempting to refresh...');
      
      try {
        // Обновляем токен
        const authData = await refreshAccessToken();
        console.log('✅ Token refreshed successfully');

        // Сохраняем новые токены
        await saveTokens(authData.access_token, authData.refresh_token);

        // Повторяем запрос с новым токеном
        const newHeaders = {
          ...getHeaders(),
          'Authorization': `Bearer ${authData.access_token}`,
          ...(options.headers || {}),
        };

        console.log('🔄 Retrying request with new token...');
        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
        
        console.log(`📡 Retry response status: ${response.status}`);
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError);
        // Если не удалось обновить токен - выходим из системы
        await deleteTokens();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Authenticated fetch error:', error);
    throw error;
  }
};

/**
 * Удаление аккаунта пользователя
 * ⚠️ Необратимая операция! Удаляет все данные пользователя.
 */
export const deleteAccount = async (): Promise<void> => {
  try {
    const response = await authenticatedFetch(`${API_ENDPOINTS.AUTH.DELETE_ACCOUNT}`, {
      method: 'DELETE',
    });

    // 204 No Content - успешное удаление
    if (response.status === 204) {
      // Очищаем локальные токены после удаления
      await deleteTokens();
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete account');
    }
  } catch (error) {
    console.error('Delete account error:', error);
    throw error;
  }
};

