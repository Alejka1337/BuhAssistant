/**
 * Fetch wrapper with ngrok support
 * Автоматически добавляет необходимые заголовки для работы с ngrok
 */

export const fetchWithHeaders = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Пропускаем предупреждение ngrok
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

