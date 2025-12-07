import { API_URL, getHeaders } from '../constants/api';
import { authenticatedFetch } from './authService';

export interface ArticleAuthor {
  id: number;
  full_name: string;
  email: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  author: ArticleAuthor;
  views: number;
  created_at: string;
  published_at: string | null;
}

export interface Article extends ArticleListItem {
  content: string;
  author_id: number;
  is_published: boolean;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface ArticleListResponse {
  articles: ArticleListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  cover_image?: string;
  is_published: boolean;
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  cover_image?: string;
  is_published?: boolean;
}

/**
 * Получить список статей
 */
export async function getArticles(
  page: number = 1,
  per_page: number = 20,
  search?: string,
  published_only: boolean = true
): Promise<ArticleListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: per_page.toString(),
    published_only: published_only.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`${API_URL}/api/articles?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }

  return response.json();
}

/**
 * Получить статью по slug
 */
export async function getArticleBySlug(slug: string): Promise<Article> {
  const response = await fetch(`${API_URL}/api/articles/${slug}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch article');
  }

  return response.json();
}

/**
 * Создать новую статью (требует авторизации и роли модератора/админа)
 */
export async function createArticle(data: CreateArticleData): Promise<Article> {
  const response = await authenticatedFetch(`${API_URL}/api/articles`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create article');
  }

  return response.json();
}

/**
 * Обновить статью (требует авторизации и прав доступа)
 */
export async function updateArticle(id: number, data: UpdateArticleData): Promise<Article> {
  const response = await authenticatedFetch(`${API_URL}/api/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update article');
  }

  return response.json();
}

/**
 * Удалить статью (требует роли админа)
 */
export async function deleteArticle(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/articles/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete article');
  }
}

