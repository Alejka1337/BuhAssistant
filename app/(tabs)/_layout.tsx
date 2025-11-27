// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Colors as ThemeColors, Typography } from '@/constants/Theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
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
