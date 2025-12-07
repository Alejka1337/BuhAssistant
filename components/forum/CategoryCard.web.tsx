// components/forum/CategoryCard.web.tsx - WEB VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ForumCategory } from '../../utils/forumService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

// Inject CSS for smooth transitions
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .forum-category-card {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
  `;
  if (!document.getElementById('forum-category-card-styles')) {
    style.id = 'forum-category-card-styles';
    document.head.appendChild(style);
  }
}

interface CategoryCardProps {
  category: ForumCategory;
  onPress: (categoryId: number) => void;
}

export default function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(category.id)}
      activeOpacity={0.7}
      // @ts-ignore - className для веб
      className="forum-category-card"
      // @ts-ignore - для веб hover
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = '#1e2126';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = Colors.cardBackground;
      }}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={(category.icon as any) || 'forum'}
          size={32}
          color={Colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{category.name}</Text>
        {category.description && (
          <Text style={styles.description} numberOfLines={2}>
            {category.description}
          </Text>
        )}
        <Text style={styles.count}>
          {category.threads_count} {category.threads_count === 1 ? 'топік' : 'топіків'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  count: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});

