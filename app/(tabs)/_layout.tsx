// app/(tabs)/_layout.tsx
import { Tabs, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Colors as ThemeColors, Typography } from '@/constants/Theme';
import { useResponsive } from '@/utils/responsive';
import DesktopLayout from '@/components/web/DesktopLayout';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isDesktop, isMobile } = useResponsive();
  
  // Для Desktop Web - используем Sidebar вместо Tabs
  if (Platform.OS === 'web' && isDesktop) {
    return (
      <DesktopLayout>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="tools" />
          <Stack.Screen name="search" />
          <Stack.Screen name="forum" />
          <Stack.Screen name="profile" />
        </Stack>
      </DesktopLayout>
    );
  }
  
  // Для Mobile Web - используем Stack с бургер-меню
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: ThemeColors.background }}>
        <MobileMenu />
        <MobileMenuWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="calendar" />
            <Stack.Screen name="tools" />
            <Stack.Screen name="search" />
            <Stack.Screen name="forum" />
            <Stack.Screen name="profile" />
          </Stack>
        </MobileMenuWrapper>
      </View>
    );
  }
  
  // Для iOS и Android - текущая реализация с Tabs
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: ThemeColors.cardBackground,
          borderBottomWidth: 2,
          borderBottomColor: ThemeColors.primary, // Зелёная полоска
        },
        headerTintColor: ThemeColors.textPrimary,
        headerTitleStyle: {
          fontFamily: Typography.h3.fontFamily,
          fontSize: Typography.h3.fontSize,
          fontWeight: Typography.h3.fontWeight as any,
          color: ThemeColors.textPrimary,
        },
        headerTitleAlign: 'center',
        tabBarActiveTintColor: ThemeColors.primary,
        tabBarInactiveTintColor: ThemeColors.textMuted,
        tabBarStyle: { 
          backgroundColor: ThemeColors.cardBackground, 
          borderTopWidth: 1, 
          borderTopColor: ThemeColors.primary,
          // Динамическая высота с учетом безопасной зоны
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: Typography.body.fontFamily,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'eGlavBuh Головна',
          tabBarLabel: 'Головна',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Календар бухгалтера',
          tabBarLabel: 'Календар',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="calendar-today" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Інструменти',
          tabBarLabel: 'Інструменти',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="build" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Пошук',
          tabBarLabel: 'Пошук',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Форум',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="forum" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
