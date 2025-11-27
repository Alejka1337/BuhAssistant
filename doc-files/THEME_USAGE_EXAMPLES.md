# Примеры использования Theme.ts

## Основной импорт

```typescript
import { Theme, Typography, Colors, Fonts } from '@/constants/Theme';
```

## Примеры использования

### 1. Типографика - готовые стили

```typescript
import { Text } from 'react-native';
import { Typography } from '@/constants/Theme';

export default function Example() {
  return (
    <>
      <Text style={Typography.h1}>Главный заголовок</Text>
      <Text style={Typography.h2}>Второстепенный заголовок</Text>
      <Text style={Typography.h3}>Подзаголовок</Text>
      <Text style={Typography.body}>Основной текст параграфа</Text>
      <Text style={Typography.bodyBold}>Жирный текст</Text>
      <Text style={Typography.caption}>Мелкий текст (подписи)</Text>
      <Text style={Typography.link}>Ссылка</Text>
    </>
  );
}
```

### 2. Кастомные стили с использованием Theme

```typescript
import { StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.background,
    padding: Theme.Spacing.md,
  },
  card: {
    backgroundColor: Theme.Colors.cardBackground,
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.md,
    ...Theme.Shadows.medium,
  },
  title: {
    fontFamily: Theme.Fonts.heading, // Unbounded
    fontSize: Theme.Fonts.sizes.xl,
    fontWeight: Theme.Fonts.weights.bold,
    color: Theme.Colors.textPrimary,
  },
  description: {
    fontFamily: Theme.Fonts.body, // BloggerSans
    fontSize: Theme.Fonts.sizes.base,
    color: Theme.Colors.textSecondary,
    lineHeight: Theme.Fonts.sizes.base * Theme.Fonts.lineHeights.normal,
  },
  button: {
    backgroundColor: Theme.Colors.primary,
    borderRadius: Theme.BorderRadius.md,
    paddingVertical: Theme.Spacing.sm,
    paddingHorizontal: Theme.Spacing.lg,
    ...Theme.Shadows.small,
  },
  buttonText: {
    ...Typography.button,
  },
});
```

### 3. Комбинирование готовых и кастомных стилей

```typescript
import { Text, StyleSheet } from 'react-native';
import { Typography, Theme } from '@/constants/Theme';

const styles = StyleSheet.create({
  customTitle: {
    ...Typography.h2, // Базовый стиль заголовка
    color: Theme.Colors.primary, // Переопределяем цвет
    marginBottom: Theme.Spacing.md,
  },
  customBody: {
    ...Typography.body,
    fontSize: Theme.Fonts.sizes.lg, // Увеличиваем размер
  },
});

export default function Example() {
  return (
    <>
      <Text style={styles.customTitle}>Зелёный заголовок</Text>
      <Text style={styles.customBody}>Увеличенный текст</Text>
    </>
  );
}
```

### 4. Условные стили с Theme

```typescript
import { Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

export default function StatusText({ status }: { status: 'success' | 'error' | 'warning' }) {
  const statusColor = {
    success: Theme.Colors.success,
    error: Theme.Colors.error,
    warning: Theme.Colors.warning,
  }[status];

  return (
    <Text style={[styles.text, { color: statusColor }]}>
      Статус: {status}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Theme.Fonts.body,
    fontSize: Theme.Fonts.sizes.base,
    fontWeight: Theme.Fonts.weights.semibold,
  },
});
```

### 5. Кнопки с Theme

```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme, Typography } from '@/constants/Theme';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary' 
}: { 
  title: string; 
  onPress: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' 
}) {
  const variantStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    danger: styles.dangerButton,
  };

  return (
    <TouchableOpacity 
      style={[styles.button, variantStyles[variant]]} 
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Theme.BorderRadius.md,
    paddingVertical: Theme.Spacing.md,
    paddingHorizontal: Theme.Spacing.lg,
    alignItems: 'center',
    ...Theme.Shadows.small,
  },
  buttonText: {
    ...Typography.button,
  },
  primaryButton: {
    backgroundColor: Theme.Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Theme.Colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.Colors.primary,
  },
  dangerButton: {
    backgroundColor: Theme.Colors.error,
  },
});
```

### 6. Адаптивные отступы

```typescript
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

const styles = StyleSheet.create({
  section: {
    paddingVertical: Theme.Spacing.lg,
    paddingHorizontal: Theme.Spacing.md,
    gap: Theme.Spacing.sm, // Расстояние между дочерними элементами
  },
  compactSection: {
    padding: Theme.Spacing.xs,
  },
  spaciousSection: {
    padding: Theme.Spacing.xxl,
  },
});
```

### 7. Тени и elevation

```typescript
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

const styles = StyleSheet.create({
  smallCard: {
    backgroundColor: Theme.Colors.cardBackground,
    borderRadius: Theme.BorderRadius.md,
    padding: Theme.Spacing.md,
    ...Theme.Shadows.small, // Легкая тень
  },
  mediumCard: {
    backgroundColor: Theme.Colors.cardBackground,
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.lg,
    ...Theme.Shadows.medium, // Средняя тень
  },
  modalCard: {
    backgroundColor: Theme.Colors.modalBackground,
    borderRadius: Theme.BorderRadius.xl,
    padding: Theme.Spacing.xl,
    ...Theme.Shadows.large, // Сильная тень
  },
});
```

### 8. Миграция со старых стилей

**Было:**
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
  },
  button: {
    backgroundColor: '#282',
    padding: 16,
    borderRadius: 8,
  },
});
```

**Стало:**
```typescript
import { Theme, Typography } from '@/constants/Theme';

const styles = StyleSheet.create({
  title: Typography.h2, // Или кастомизируем
  button: {
    backgroundColor: Theme.Colors.primary,
    padding: Theme.Spacing.md,
    borderRadius: Theme.BorderRadius.md,
  },
});
```

## Преимущества централизованной системы

1. ✅ **Единообразие** - все экраны используют одни и те же значения
2. ✅ **Легкость изменений** - меняешь в одном месте, применяется везде
3. ✅ **Типобезопасность** - TypeScript подсказывает доступные значения
4. ✅ **Масштабируемость** - легко добавлять новые темы (light/dark)
5. ✅ **Читаемость** - `Theme.Colors.primary` понятнее, чем `#282`
6. ✅ **Документированность** - все параметры в одном файле

## Быстрая шпаргалка

| Что нужно | Откуда взять |
|-----------|--------------|
| Цвет фона | `Theme.Colors.background` |
| Цвет карточки | `Theme.Colors.cardBackground` |
| Акцентный цвет | `Theme.Colors.primary` |
| Основной текст | `Theme.Colors.textPrimary` |
| Шрифт заголовка | `Theme.Fonts.heading` (Unbounded) |
| Шрифт текста | `Theme.Fonts.body` (BloggerSans) |
| Отступ маленький | `Theme.Spacing.sm` (8px) |
| Отступ средний | `Theme.Spacing.md` (16px) |
| Отступ большой | `Theme.Spacing.lg` (24px) |
| Скругление углов | `Theme.BorderRadius.md` (8px) |
| Тень | `Theme.Shadows.medium` |
| Готовый H1 | `Typography.h1` |
| Готовый body | `Typography.body` |

