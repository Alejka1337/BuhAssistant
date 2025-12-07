import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import ConsultationModal from './../../components/ConsultationModal.web';

const NAVIGATION_ITEMS = [
  { name: 'index', label: 'Головна', icon: 'home', path: '/(tabs)' },
  { name: 'calendar', label: 'Календар', icon: 'calendar-today', path: '/(tabs)/calendar' },
  { name: 'news', label: 'Новини', icon: 'article', path: '/news' },
  { name: 'tools', label: 'Інструменти', icon: 'build', path: '/(tabs)/tools' },
  { name: 'search', label: 'Пошук', icon: 'search', path: '/(tabs)/search' },
  { name: 'forum', label: 'Форум', icon: 'forum', path: '/(tabs)/forum' },
  { name: 'articles', label: 'Статті', icon: 'library-books', path: '/articles' },
  { name: 'profile', label: 'Профіль', icon: 'person', path: '/(tabs)/profile' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
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
    <View style={styles.sidebar}>
      <View style={styles.topSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>eGlavBuh</Text>
          <Text style={styles.logoSubtext}>Бухгалтерський помічник</Text>
        </View>
        
        <View style={styles.navigation}>
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = pathname.includes(item.name);
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => router.push(item.path as any)}
              >
                <MaterialIcons 
                  name={item.icon as any} 
                  size={24} 
                  color={isActive ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Кнопка консультации с пульсацией */}
      <View style={styles.consultationContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.consultationButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="headset-mic" size={24} color={Colors.white} />
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
    backgroundColor: Colors.cardBackground,
    borderRightWidth: 2,
    borderRightColor: Colors.primary,
    height: '100vh' as any,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  topSection: {
    flex: 1,
  },
  logo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    marginBottom: Spacing.lg,
  },
  logoText: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: 4,
  },
  logoSubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  navigation: {
    gap: Spacing.xs as any,
    paddingHorizontal: Spacing.sm,
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
    backgroundColor: Colors.background,
  },
  navLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  consultationContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  consultationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  consultationButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
});

