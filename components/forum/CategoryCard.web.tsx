// components/forum/CategoryCard.web.tsx - WEB VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ForumCategory } from '../../utils/forumService';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CategoryCardProps {
  category: ForumCategory;
  onPress: (categoryId: number) => void;
}

export default function CategoryCard({ category, onPress }: CategoryCardProps) {
  const { theme, colors } = useTheme();
  
  const hoverBgColor = theme === 'dark' ? '#1e2126' : '#e9ecef';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={() => onPress(category.id)}
      activeOpacity={0.7}
      // @ts-ignore - className для веб
      className="forum-category-card"
      // @ts-ignore - для веб hover
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = hoverBgColor;
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = colors.cardBackground;
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons
          name={(category.icon as any) || 'forum'}
          size={32}
          color={colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{category.name}</Text>
        {category.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {category.description}
          </Text>
        )}
        <Text style={[styles.count, { color: colors.primary }]}>
          {category.threads_count} {category.threads_count === 1 ? 'топік' : 'топіків'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.bodyBold,
    marginBottom: 4,
  },
  description: {
    ...Typography.caption,
    marginBottom: 4,
  },
  count: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
});

