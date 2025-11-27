import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

interface LikeButtonProps {
  likesCount: number;
  isLiked: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function LikeButton({ likesCount, isLiked, onPress, disabled }: LikeButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isLiked && styles.likedButton]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={isLiked ? 'favorite' : 'favorite-border'}
        size={18}
        color={isLiked ? '#ff0000' : Colors.textSecondary} // Яркий красный цвет
      />
      {likesCount > 0 && (
        <Text style={[styles.count, isLiked && styles.likedCount]}>
          {likesCount}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  likedButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  count: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  likedCount: {
    color: '#ff0000', // Яркий красный цвет для лайкнутого
  },
});

