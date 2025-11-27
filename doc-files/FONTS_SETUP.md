# Инструкция по установке кастомных шрифтов

## 1. Скачать шрифты

### Unbounded (для заголовков)
- Скачайте с Google Fonts: https://fonts.google.com/specimen/Unbounded
- Нужны файлы: `Unbounded-Regular.ttf`, `Unbounded-Medium.ttf`, `Unbounded-SemiBold.ttf`, `Unbounded-Bold.ttf`

### Blogger Sans (для текста)
- Скачайте шрифт Blogger Sans
- Нужны файлы: `BloggerSans-Regular.ttf`, `BloggerSans-Medium.ttf`, `BloggerSans-Bold.ttf`

**Альтернатива Blogger Sans:**
Если Blogger Sans недоступен, можно использовать похожий шрифт:
- **Inter** - https://fonts.google.com/specimen/Inter
- **Roboto** - https://fonts.google.com/specimen/Roboto
- **Open Sans** - https://fonts.google.com/specimen/Open+Sans

## 2. Разместить файлы шрифтов

Скопируйте все файлы `.ttf` в папку:
```
/Users/alejka1337/Desktop/buhassistant/assets/fonts/
```

Структура должна быть:
```
assets/fonts/
  ├── Unbounded-Regular.ttf
  ├── Unbounded-Medium.ttf
  ├── Unbounded-SemiBold.ttf
  ├── Unbounded-Bold.ttf
  ├── BloggerSans-Regular.ttf
  ├── BloggerSans-Medium.ttf
  ├── BloggerSans-Bold.ttf
  └── SpaceMono-Regular.ttf (уже есть)
```

## 3. Загрузить шрифты в приложение

Создайте или обновите файл `app/_layout.tsx`:

```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Предотвращаем скрытие splash screen до загрузки шрифтов
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Unbounded - для заголовков
    'Unbounded': require('../assets/fonts/Unbounded-Regular.ttf'),
    'Unbounded-Medium': require('../assets/fonts/Unbounded-Medium.ttf'),
    'Unbounded-SemiBold': require('../assets/fonts/Unbounded-SemiBold.ttf'),
    'Unbounded-Bold': require('../assets/fonts/Unbounded-Bold.ttf'),
    
    // BloggerSans - для текста
    'BloggerSans': require('../assets/fonts/BloggerSans-Regular.ttf'),
    'BloggerSans-Medium': require('../assets/fonts/BloggerSans-Medium.ttf'),
    'BloggerSans-Bold': require('../assets/fonts/BloggerSans-Bold.ttf'),
    
    // SpaceMono - моноширинный
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    // Ваш основной layout
  );
}
```

## 4. Использование шрифтов

После загрузки шрифтов используйте их через `constants/Theme.ts`:

```typescript
import { Theme, Typography } from '@/constants/Theme';
import { Text, StyleSheet } from 'react-native';

// Пример 1: Использование готовых типографических стилей
<Text style={Typography.h1}>Заголовок H1</Text>
<Text style={Typography.body}>Основной текст</Text>

// Пример 2: Кастомные стили с шрифтами
const styles = StyleSheet.create({
  title: {
    fontFamily: Theme.Fonts.heading, // 'Unbounded'
    fontSize: Theme.Fonts.sizes.xl,
    fontWeight: Theme.Fonts.weights.bold,
    color: Theme.Colors.textPrimary,
  },
  description: {
    fontFamily: Theme.Fonts.body, // 'BloggerSans'
    fontSize: Theme.Fonts.sizes.base,
    color: Theme.Colors.textSecondary,
  },
});
```

## 5. iOS специфика

Для iOS шрифты автоматически подхватываются через `useFonts`.

Если нужна дополнительная настройка, добавьте в `ios/buhassistant/Info.plist`:

```xml
<key>UIAppFonts</key>
<array>
  <string>Unbounded-Regular.ttf</string>
  <string>Unbounded-Medium.ttf</string>
  <string>Unbounded-SemiBold.ttf</string>
  <string>Unbounded-Bold.ttf</string>
  <string>BloggerSans-Regular.ttf</string>
  <string>BloggerSans-Medium.ttf</string>
  <string>BloggerSans-Bold.ttf</string>
  <string>SpaceMono-Regular.ttf</string>
</array>
```

## 6. Android специфика

Для Android создайте файл `react-native.config.js` в корне проекта:

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'],
};
```

Затем выполните:
```bash
npx react-native-asset
```

## 7. Пересобрать приложение

После добавления шрифтов:

```bash
# Для iOS
npx expo prebuild --clean
cd ios && pod install
npx expo run:ios

# Для Android
npx expo prebuild --clean
npx expo run:android
```

## 8. Проверка работы шрифтов

Создайте тестовый экран:

```typescript
import { View, Text } from 'react-native';
import { Typography } from '@/constants/Theme';

export default function FontTest() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={Typography.h1}>H1 - Unbounded Bold</Text>
      <Text style={Typography.h2}>H2 - Unbounded Bold</Text>
      <Text style={Typography.h3}>H3 - Unbounded SemiBold</Text>
      <Text style={Typography.body}>Body - BloggerSans Regular</Text>
      <Text style={Typography.bodyBold}>Body Bold - BloggerSans Bold</Text>
      <Text style={Typography.caption}>Caption - BloggerSans Regular</Text>
    </View>
  );
}
```

## Важные замечания

1. **Имена файлов**: Используйте точные имена файлов без пробелов
2. **Начертания**: Для `fontWeight` в React Native используйте строковые значения ('400', '500', '600', '700')
3. **Fallback**: Если шрифт не загрузился, система использует дефолтный
4. **Размер**: Шрифты увеличивают размер приложения, используйте только необходимые начертания

## Быстрый старт (если шрифты уже есть)

```bash
# 1. Поместите файлы в assets/fonts/
# 2. Обновите app/_layout.tsx с useFonts
# 3. Пересоберите:
npx expo prebuild --clean
npx expo run:ios
```

