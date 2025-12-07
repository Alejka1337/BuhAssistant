import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useResponsive } from '@/utils/responsive';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Sidebar from './Sidebar';
import { Colors, Spacing } from '@/constants/Theme';

interface PageWrapperProps {
  children: React.ReactNode;
  withSidebar?: boolean; // По умолчанию true для Desktop
  showMobileNav?: boolean; // Показывать нижнюю навигацию на веб мобильных
}

/**
 * Универсальная обертка для всех страниц
 * - Автоматически добавляет Sidebar на Desktop
 * - Добавляет нижнюю навигацию на Web Mobile (если showMobileNav = true)
 * - Работает для всех страниц (tabs, auth, news, forum threads, etc.)
 */
export default function PageWrapper({ children, withSidebar = true, showMobileNav = false }: PageWrapperProps) {
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const pathname = usePathname();
  
  // Для Desktop Web - показываем Sidebar
  if (Platform.OS === 'web' && isDesktop && withSidebar) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar />
        <View style={styles.desktopContent}>
          {children}
        </View>
      </View>
    );
  }
  
  // Для Web Mobile - показываем контент + нижняя навигация (если showMobileNav = true)
  if (Platform.OS === 'web' && !isDesktop && showMobileNav) {
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileContent}>
          {children}
        </View>
        <View style={styles.mobileNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(tabs)')}
          >
            <MaterialIcons 
              name="home" 
              size={24} 
              color={pathname === '/(tabs)' ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={24} 
              color={pathname.includes('/calendar') ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/tools')}
          >
            <MaterialIcons 
              name="build" 
              size={24} 
              color={pathname.includes('/tools') ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/search')}
          >
            <MaterialIcons 
              name="search" 
              size={24} 
              color={pathname.includes('/search') ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/forum')}
          >
            <MaterialIcons 
              name="forum" 
              size={24} 
              color={pathname.includes('/forum') ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <MaterialIcons 
              name="person" 
              size={24} 
              color={pathname.includes('/profile') ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Для Native Mobile/Tablet - просто показываем контент
  return <>{children}</>;
}

const styles = StyleSheet.create({
  desktopContainer: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: Colors.background,
    height: '100vh' as any,
  },
  desktopContent: {
    flex: 1,
    overflow: 'auto' as any,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mobileContent: {
    flex: 1,
  },
  mobileNav: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

