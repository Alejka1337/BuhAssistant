// components/SearchResultCard.web.tsx - WEB VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '../constants/Theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  title: string;
  description: string;
  url: string;
  site: string;
  onPress?: () => void;
};

export const SearchResultCard = ({ title, description, url, site, onPress }: Props) => {
  const { theme, colors } = useTheme();
  
  const hoverBgColor = theme === 'dark' ? '#1e2126' : '#e9ecef';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}
      onPress={onPress}
      // @ts-ignore - className для веб
      className="search-result-card"
      // @ts-ignore - для веб hover
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = hoverBgColor;
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = colors.cardBackground;
      }}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>{description}</Text>
      <View style={styles.footer}>
        <View style={[styles.siteTag, { borderColor: colors.textSecondary }]}>
          <Text style={[styles.site, { color: colors.success }]}>{site}</Text>
        </View>
        <View style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.white }]}>Відкрити</Text>
          <MaterialIcons name="arrow-forward" size={16} color={colors.white} style={styles.buttonIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    ...Typography.bodyBold,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  description: {
    ...Typography.caption,
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  siteTag: {
    backgroundColor: 'rgba(210, 225, 214, 0.13)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    marginRight: Spacing.sm,
  },
  site: { 
    ...Typography.caption,
    fontWeight: '700',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: { 
    ...Typography.caption,
    fontWeight: '600',
    marginRight: 4,
  },
  buttonIcon: {
    marginLeft: 2,
  },
});

