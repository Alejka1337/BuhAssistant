import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

// Константы для определения платформы
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Breakpoints для responsive дизайна
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

/**
 * Hook для определения текущего размера экрана и breakpoint
 */
export const useResponsive = () => {
  const { width } = Dimensions.get('window');
  
  return {
    isMobile: width < BREAKPOINTS.desktop,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
    isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
    screenWidth: width,
  };
};

/**
 * Hook для отслеживания изменений размера окна
 * Полезен для адаптации layout при изменении размера браузера
 */
export const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

/**
 * Функция для получения стилей контейнера в зависимости от ширины экрана
 * Применяет max-width 1440px для desktop
 */
export const getContainerStyle = (width: number) => {
  if (width >= BREAKPOINTS.desktop) {
    return {
      maxWidth: 1440,
      marginHorizontal: 'auto' as const,
      paddingHorizontal: 24,
    };
  }
  return {};
};

/**
 * Определяет количество колонок для Grid в зависимости от размера экрана
 */
export const getGridColumns = (
  width: number,
  config: { mobile?: number; tablet?: number; desktop?: number } = {}
) => {
  const { mobile = 1, tablet = 2, desktop = 3 } = config;
  
  if (width >= BREAKPOINTS.desktop) return desktop;
  if (width >= BREAKPOINTS.tablet) return tablet;
  return mobile;
};

