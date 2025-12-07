import * as SecureStore from 'expo-secure-store';
import { API_URL, getHeaders } from '../constants/api';
import { authenticatedFetch } from './authService';

// ========== Типы ==========

export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  created_at: string;
  threads_count: number;
}

export interface ForumThreadAuthor {
  id: number;
  full_name?: string;
  email: string;
}

export interface ForumThread {
  id: number;
  category_id: number;
  user_id: number;
  title: string;
  content: string;
  views: number;
  is_pinned: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  author?: ForumThreadAuthor;
  category_name?: string;
  posts_count: number;
  likes_count?: number;
  posts?: ForumPost[]; // Список комментариев с вложенностью
}

export interface ForumThreadListItem {
  id: number;
  category_id: number;
  title: string;
  views: number;
  is_pinned: boolean;
  is_closed: boolean;
  created_at: string;
  author?: ForumThreadAuthor;
  posts_count: number;
  last_post_at?: string;
}

export interface ForumPostAuthor {
  id: number;
  full_name?: string;
}

export interface ForumPost {
  id: number;
  thread_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  author?: ForumPostAuthor;
  likes_count: number;
  is_liked_by_user: boolean;
  replies: ForumPost[];
}

export interface ThreadSortType {
  value: 'new' | 'hot' | 'unanswered';
  label: string;
}

// ========== Функции для работы с токеном ==========

const TOKEN_KEY = 'auth_token'; // Должен совпадать с authService.ts

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    return {
      ...getHeaders(),
      'Authorization': `Bearer ${token}`,
    };
  }
  return getHeaders();
}

// ========== API функции ==========

/**
 * Получить список всех категорий
 */
export async function getCategories(): Promise<ForumCategory[]> {
  const response = await fetch(`${API_URL}/api/forum/categories`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

/**
 * Получить список топиков с фильтрацией и сортировкой
 */
export async function getThreads(
  categoryId?: number,
  sort: 'new' | 'hot' | 'unanswered' = 'new',
  limit: number = 20,
  offset: number = 0
): Promise<{ items: ForumThreadListItem[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams({
    sort,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (categoryId) {
    params.append('category_id', categoryId.toString());
  }

  const response = await fetch(`${API_URL}/api/forum/threads?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch threads');
  }

  return response.json();
}

/**
 * Получить детали топика со всеми комментариями
 */
export async function getThreadById(threadId: number): Promise<ForumThread & { posts: ForumPost[] }> {
  // Пробуем с authenticatedFetch (для авторизованных пользователей)
  try {
    const response = await authenticatedFetch(`${API_URL}/api/forum/threads/${threadId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch thread');
    }

    return response.json();
  } catch (error: any) {
    // Если нет токена, пробуем без авторизации (для гостей)
    if (error.message === 'No access token') {
      const response = await fetch(`${API_URL}/api/forum/threads/${threadId}`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch thread');
      }

      return response.json();
    }
    throw error;
  }
}

/**
 * Создать новый топик
 */
export async function createThread(data: {
  category_id: number;
  title: string;
  content: string;
}): Promise<ForumThread> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/threads`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    // Проверяем, является ли это ошибкой модерации
    if (errorData.detail && typeof errorData.detail === 'object' && errorData.detail.reason) {
      // Создаем объект ошибки с полями модерации
      const moderationError: any = new Error('Moderation error');
      moderationError.status = response.status;
      moderationError.detail = errorData.detail;
      throw moderationError;
    }
    
    // Обычная ошибка
    throw new Error(errorData.detail || 'Failed to create thread');
  }

  return response.json();
}

/**
 * Редактировать топик
 */
export async function updateThread(
  threadId: number,
  data: { title?: string; content?: string }
): Promise<ForumThread> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/threads/${threadId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update thread');
  }

  return response.json();
}

/**
 * Удалить топик
 */
export async function deleteThread(threadId: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/threads/${threadId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete thread');
  }
}

/**
 * Создать комментарий/ответ
 */
export async function createPost(data: {
  thread_id: number;
  content: string;
  parent_id?: number;
}): Promise<ForumPost> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    // Проверяем, является ли это ошибкой модерации
    if (errorData.detail && typeof errorData.detail === 'object' && errorData.detail.reason) {
      // Создаем объект ошибки с полями модерации
      const moderationError: any = new Error('Moderation error');
      moderationError.status = response.status;
      moderationError.detail = errorData.detail;
      throw moderationError;
    }
    
    // Обычная ошибка
    throw new Error(errorData.detail || 'Failed to create post');
  }

  return response.json();
}

/**
 * Редактировать комментарий
 */
export async function updatePost(postId: number, content: string): Promise<ForumPost> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update post');
  }

  return response.json();
}

/**
 * Удалить комментарий
 */
export async function deletePost(postId: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/posts/${postId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete post');
  }
}

/**
 * Лайкнуть/анлайкнуть комментарий (toggle)
 */
export async function toggleLike(postId: number): Promise<{ liked: boolean; likes_count: number }> {
  const response = await authenticatedFetch(`${API_URL}/api/forum/likes?post_id=${postId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    let errorMessage = 'Failed to toggle like';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } else {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        errorMessage = `Server error (${response.status}): ${response.statusText}`;
      }
    } catch (parseError) {
      console.error('❌ Error parsing error response:', parseError);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Поиск по форуму
 */
export async function searchForum(query: string): Promise<{
  items: Array<{
    type: 'thread' | 'post';
    id: number;
    title?: string;
    content: string;
    thread_id?: number;
    created_at: string;
    author?: ForumPostAuthor;
  }>;
  total: number;
}> {
  const params = new URLSearchParams({ q: query });
  
  const response = await fetch(`${API_URL}/api/forum/search?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to search forum');
  }

  return response.json();
}

