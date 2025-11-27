/**
 * @deprecated Используйте Theme.ts для полной айдентики (цвета + шрифты)
 * Этот файл оставлен для обратной совместимости
 */

import { Colors as ThemeColors, LegacyColors } from './Theme';

// Re-export цветов из Theme.ts
export const Colors = ThemeColors;

// Legacy export для старых компонентов
export default LegacyColors;
