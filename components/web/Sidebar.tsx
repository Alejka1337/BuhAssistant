import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Typography, Spacing, BorderRadius, } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import ConsultationModal from './../../components/ConsultationModal.web';

const NAVIGATION_ITEMS = [
  { name: 'index', label: 'Головна', icon: 'home', path: '/(tabs)' },
  { name: 'calendar', label: 'Календар', icon: 'calendar-today', path: '/(tabs)/calendar' },
  { name: 'news', label: 'Новини', icon: 'article', path: '/news' },
  { name: 'tools', label: 'Інструменти', icon: 'build', path: '/(tabs)/tools' },
  { name: 'search', label: 'Пошук', icon: 'search', path: '/(tabs)/search' },
  { name: 'forum', label: 'Форум', icon: 'forum', path: '/(tabs)/forum' },
  { name: 'articles', label: 'Статті', icon: 'library-books', path: '/articles' },
  { name: 'tax-requisites', label: 'Реквізити', icon: 'account-balance', path: '/tax-requisites' },
  { name: 'profile', label: 'Профіль', icon: 'person', path: '/(tabs)/profile' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, colors, toggleTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.cardBackground, borderRightColor: colors.borderColor }]}>
      <View style={[styles.logo, { borderBottomColor: colors.borderColor }]}>
        <View style={styles.logoContent}>
          <Text style={[styles.logoText, { color: colors.primary }]}>eGlavBuh</Text>
          <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>Бухгалтерський помічник</Text>
        </View>
        {/* Кнопка переключения темы - только иконка */}
        <TouchableOpacity
          style={[styles.themeToggleIcon, { backgroundColor: colors.background }]}
          onPress={toggleTheme}
        >
          <MaterialIcons 
            name={theme === 'dark' ? 'light-mode' : 'dark-mode'} 
            size={22} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.navigationScroll}
        contentContainerStyle={styles.navigation}
        showsVerticalScrollIndicator={false}
      >
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname.includes(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.navItem, 
                isActive && { ...styles.navItemActive, backgroundColor: `${colors.primary}15` }
              ]}
              onPress={() => router.push(item.path as any)}
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
      </ScrollView>

      {/* Кнопка консультации с пульсацией */}
      <View style={styles.consultationContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.consultationButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="headset-mic" size={24} color="#FFFFFF" />
            <Text style={styles.consultationButtonText}>Консультація</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ConsultationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    borderRightWidth: 2,
    height: '100vh' as any,
    paddingTop: Spacing.lg,
    flexDirection: 'column',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  logoContent: {
    flex: 1,
  },
  navigationScroll: {
    flex: 1,
  },
  logoText: {
    ...Typography.h2,
    marginBottom: 4,
  },
  logoSubtext: {
    ...Typography.caption,
  },
  navigation: {
    gap: Spacing.xs as any,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md as any,
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
  themeToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultationContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#34495e',
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
});

