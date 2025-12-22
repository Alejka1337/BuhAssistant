import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Typography, Spacing, BorderRadius, } from '../../constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import ConsultationModal from './../../components/ConsultationModal.web';

// Компонент-обертка для контента с отступом под header
export function MobileMenuWrapper({ children }: { children: ReactNode }) {
  return (
    <View style={styles.contentWrapper}>
      {children}
    </View>
  );
}

const NAVIGATION_ITEMS = [
  { name: 'index', label: 'Головна', icon: 'home', path: '/(tabs)' },
  { name: 'calendar', label: 'Календар', icon: 'calendar-today', path: '/(tabs)/calendar' },
  { name: 'tools', label: 'Інструменти', icon: 'build', path: '/(tabs)/tools' },
  { name: 'search', label: 'Пошук', icon: 'search', path: '/(tabs)/search' },
  { name: 'forum', label: 'Форум', icon: 'forum', path: '/(tabs)/forum' },
  { name: 'articles', label: 'Статті', icon: 'library-books', path: '/articles' },
  { name: 'tax-requisites', label: 'Реквізити', icon: 'account-balance', path: '/tax-requisites' },
  { name: 'news', label: 'Всі новини', icon: 'article', path: '/news' },
  { name: 'profile', label: 'Профіль', icon: 'person', path: '/(tabs)/profile' },
];

// Функция для получения заголовка страницы
const getPageTitle = (pathname: string): string => {
  if (pathname === '/' || pathname.includes('/(tabs)') && !pathname.includes('calendar') && !pathname.includes('tools') && !pathname.includes('search') && !pathname.includes('forum') && !pathname.includes('profile')) {
    return 'Головна';
  }
  if (pathname.includes('/calendar')) return 'Календар';
  if (pathname.includes('/tools')) return 'Інструменти';
  if (pathname.includes('/search')) return 'Пошук';
  if (pathname.includes('/forum/create')) return 'Створити тему';
  if (pathname.includes('/forum/thread/')) return 'Форум';
  if (pathname.includes('/forum')) return 'Форум';
  if (pathname.includes('/tax-requisites')) return 'Реквізити';
  if (pathname.includes('/articles')) return 'Статті';
  if (pathname.includes('/news')) return 'Всі новини';
  if (pathname.includes('/profile')) return 'Профіль';
  if (pathname.includes('/login')) return 'Вхід';
  if (pathname.includes('/register')) return 'Реєстрація';
  if (pathname.includes('/verify-email')) return 'Верифікація';
  if (pathname.includes('/forgot-password')) return 'Відновлення паролю';
  if (pathname.includes('/reset-password')) return 'Скидання паролю';
  return 'eGlavBuh';
};

interface MobileMenuProps {
  title?: string;
}

export default function MobileMenu({ title }: MobileMenuProps) {
  const { theme, colors, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-1000)); // Начальная позиция за экраном (для full width)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const pathname = usePathname();

  const pageTitle = title || getPageTitle(pathname);

  // Пульсация кнопки консультации
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleNavigate = (path: string) => {
    closeMenu();
    setTimeout(() => {
      router.push(path as any);
    }, 300);
  };

  const handleConsultationPress = () => {
    closeMenu();
    setTimeout(() => {
      setModalVisible(true);
    }, 300);
  };

  const openMenu = () => {
    setIsOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -1000,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  return (
    <>
      {/* Fixed Header with Title and Burger Button */}
      <View style={[styles.fixedHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.primary }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{pageTitle}</Text>
        <TouchableOpacity 
          style={styles.burgerButton} 
          onPress={openMenu}
        >
          <View style={[styles.burgerLine, { backgroundColor: colors.primary }]} />
          <View style={[styles.burgerLine, { backgroundColor: colors.primary }]} />
          <View style={[styles.burgerLine, { backgroundColor: colors.primary }]} />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={closeMenu}
        >
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: slideAnim }],
                backgroundColor: colors.cardBackground,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={[styles.menuHeader, { borderBottomColor: colors.borderColor }]}>
              <Text style={[styles.logoText, { color: colors.primary }]}>eGlavBuh</Text>
              <View style={styles.headerActions}>
                {/* Кнопка переключения темы - только иконка */}
                <TouchableOpacity
                  style={[styles.themeToggleIcon, { backgroundColor: colors.background }]}
                  onPress={() => {
                    toggleTheme();
                  }}
                >
                  <MaterialIcons 
                    name={theme === 'dark' ? 'light-mode' : 'dark-mode'} 
                    size={24} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
                  <MaterialIcons name="close" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation Items */}
            <View style={styles.navigation}>
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = pathname.includes(item.name);
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[
                      styles.navItem, 
                      isActive && { ...styles.navItemActive, backgroundColor: `${colors.primary}15` }
                    ]}
                    onPress={() => handleNavigate(item.path)}
                  >
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={24} 
                      color={isActive ? colors.primary : colors.textMuted} 
                    />
                    <Text style={[
                      styles.navLabel, 
                      { color: colors.textPrimary },
                      isActive && { ...styles.navLabelActive, color: colors.primary }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Кнопка консультации с пульсацией */}
            <View style={styles.consultationContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.consultationButton, { backgroundColor: colors.primary }]}
                  onPress={handleConsultationPress}
                >
                  <MaterialIcons name="headset-mic" size={24} color="#FFFFFF" />
                  <Text style={styles.consultationButtonText}>Консультація</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Модальное окно консультации */}
      <ConsultationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 1000,
  },
  pageTitle: {
    ...Typography.h3,
    flex: 1,
  },
  burgerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  burgerLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    width: '100%',
    height: '100%',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 2,
    marginBottom: Spacing.md,
  },
  logoText: {
    ...Typography.h2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeToggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigation: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  navItemActive: {
    // Dynamic styles applied inline
  },
  navLabel: {
    ...Typography.body,
  },
  navLabelActive: {
    fontWeight: '600',
  },
  consultationContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#34495e',
    paddingTop: Spacing.lg,
  },
  consultationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: '#282',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  consultationButtonText: {
    ...Typography.body,
    color: '#ffffff',
    fontWeight: '700',
  },
  contentWrapper: {
    paddingTop: 60, // Высота фиксированного header
    flex: 1,
  },
});

