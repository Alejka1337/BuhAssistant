import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setPageMeta, PageMeta } from '@/utils/seo';

/**
 * Хук для установки мета-тегов страницы (только для веб)
 */
export const useSEO = (meta: PageMeta) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      setPageMeta(meta);
    }
  }, [meta.title, meta.description, meta.keywords, meta.ogImage]);
};

