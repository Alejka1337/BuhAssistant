// components/SearchResultCard.web.tsx - WEB VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

// Inject CSS for smooth transitions and cursor
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .search-result-card {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
  `;
  if (!document.getElementById('search-result-card-styles')) {
    style.id = 'search-result-card-styles';
    document.head.appendChild(style);
  }
}

type Props = {
  title: string;
  description: string;
  url: string;
  site: string;
  onPress?: () => void;
};

export const SearchResultCard = ({ title, description, url, site, onPress }: Props) => {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      // @ts-ignore - className для веб
      className="search-result-card"
      // @ts-ignore - для веб hover
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = '#1e2126';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = Colors.cardBackground;
      }}
    >
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.description} numberOfLines={3}>{description}</Text>
      <View style={styles.footer}>
        <View style={styles.siteTag}>
          <Text style={styles.site}>{site}</Text>
        </View>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Відкрити</Text>
          <MaterialIcons name="arrow-forward" size={16} color={Colors.white} style={styles.buttonIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    ...Typography.bodyBold,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
    borderColor: Colors.textSecondary,
    shadowColor: Colors.textMuted,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    marginRight: Spacing.sm,
  },
  site: { 
    ...Typography.caption,
    color: Colors.success, 
    fontWeight: '700',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: { 
    ...Typography.caption,
    color: Colors.white, 
    fontWeight: '600',
    marginRight: 4,
  },
  buttonIcon: {
    marginLeft: 2,
  },
});

