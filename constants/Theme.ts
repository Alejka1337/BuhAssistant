/**
 * eGlavBuh Brand Identity
 * Централизованная система стилей, цветов и типографики
 */

// ==================== ЦВЕТА ====================

export const Colors = {
  // Основные цвета бренда
  primary: '#282',           // Темно-зелёный (акцентный)
  primaryDark: '#228822',    // То же самое (полная форма)
  primaryLight: '#33aa33',   // Светлее для hover/active состояний
  
  // Фоны
  background: '#1a1d21',     // Основной темный фон
  cardBackground: '#22262c', // Фон карточек (как в "Найближчі звіти")
  modalBackground: '#2c3e50', // Фон модальных окон
  
  // Текст
  textPrimary: '#ecf0f1',    // Основной текст
  textSecondary: '#bdc3c7',  // Вторичный текст
  textMuted: '#95a5a6',      // Приглушенный текст
  
  // Header
  headerBackground: '#1a1d21', // Темный header
  headerText: '#ecf0f1',       // Текст в header
  headerTint: '#282',          // Иконки в header
  
  // Borders
  borderColor: '#34495e',
  borderLight: '#2c3e50',
  
  // Status colors
  success: '#282',
  error: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  
  // Tab bar
  tabBarBackground: '#1a1d21',
  tabBarActive: '#282',
  tabBarInactive: '#7f8c8d',
  
  // Дополнительные цвета для UI
  disabled: '#7f8c8d',
  overlay: 'rgba(0, 0, 0, 0.7)',
  white: '#ffffff',
  black: '#000000',
  orange: '#FF6900',
};

// ==================== ТИПОГРАФИКА ====================

export const Fonts = {
  // Семейства шрифтов
  heading: 'Unbounded',      // Для заголовков
  body: 'Inter',             // Для основного текста
  mono: 'SpaceMono',         // Моноширинный (для кода/чисел)
  
  // Варианты начертаний
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Размеры (в пикселях)
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Межстрочный интервал
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// ==================== ТИПОГРАФИЧЕСКИЕ СТИЛИ ====================

export const Typography = {
  // Заголовки
  h1: {
    fontFamily: Fonts.heading,
    fontSize: Fonts.sizes.xxxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    lineHeight: Fonts.sizes.xxxl * Fonts.lineHeights.tight,
  },
  h2: {
    fontFamily: Fonts.heading,
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    lineHeight: Fonts.sizes.xxl * Fonts.lineHeights.tight,
  },
  h3: {
    fontFamily: Fonts.heading,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.semibold,
    color: Colors.textPrimary,
    lineHeight: Fonts.sizes.xl * Fonts.lineHeights.tight,
  },
  h4: {
    fontFamily: Fonts.heading,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold,
    color: Colors.textPrimary,
    lineHeight: Fonts.sizes.lg * Fonts.lineHeights.normal,
  },
  
  // Основной текст
  body: {
    fontFamily: Fonts.body,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.regular,
    color: Colors.textPrimary,
    lineHeight: Fonts.sizes.base * Fonts.lineHeights.normal,
  },
  bodyBold: {
    fontFamily: Fonts.body,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    lineHeight: Fonts.sizes.base * Fonts.lineHeights.normal,
  },
  
  // Мелкий текст
  caption: {
    fontFamily: Fonts.body,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.regular,
    color: Colors.textSecondary,
    lineHeight: Fonts.sizes.sm * Fonts.lineHeights.normal,
  },
  captionBold: {
    fontFamily: Fonts.body,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
    color: Colors.textSecondary,
    lineHeight: Fonts.sizes.sm * Fonts.lineHeights.normal,
  },
  
  // Кнопки
  button: {
    fontFamily: Fonts.body,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semibold,
    color: Colors.white,
    lineHeight: Fonts.sizes.base * Fonts.lineHeights.tight,
  },
  
  // Ссылки
  link: {
    fontFamily: Fonts.body,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    color: Colors.primary,
    lineHeight: Fonts.sizes.base * Fonts.lineHeights.normal,
    textDecorationLine: 'underline' as const,
  },
};

// ==================== ОТСТУПЫ И РАЗМЕРЫ ====================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const Shadows = {
  small: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ==================== ЭКСПОРТ ====================

export const Theme = {
  Colors,
  Fonts,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};

export default Theme;

// Legacy export для обратной совместимости
const tintColorLight = '#282';
const tintColorDark = '#282';

export const LegacyColors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ecf0f1',
    background: '#1a1d21',
    tint: tintColorDark,
    tabIconDefault: '#7f8c8d',
    tabIconSelected: tintColorDark,
  },
};

