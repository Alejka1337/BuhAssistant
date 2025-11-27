import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ForumCategory } from '../../utils/forumService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

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

