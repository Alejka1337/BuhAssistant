// components/forum/ThreadCard.web.tsx - WEB VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ForumThreadListItem } from '../../utils/forumService';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ThreadCardProps {
  thread: ForumThreadListItem;
  onPress: (threadId: number) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'щойно';
  if (diffMins < 60) return `${diffMins} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;
  if (diffDays < 7) return `${diffDays} дн тому`;
  
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ThreadCard({ thread, onPress }: ThreadCardProps) {
  const { theme, colors } = useTheme();
  
  const hoverBgColor = theme === 'dark' ? '#1e2126' : '#e9ecef';

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { backgroundColor: colors.cardBackground },
        thread.is_pinned && [styles.pinnedCard, { borderColor: colors.primary }]
      ]}
      onPress={() => onPress(thread.id)}
      activeOpacity={0.7}
      // @ts-ignore - className для веб
      className="forum-thread-card"
      // @ts-ignore - для веб hover
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = hoverBgColor;
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = colors.cardBackground;
      }}
    >
      {/* Header с аватаром и статистикой */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {/* Аватар пользователя */}
          <View style={[styles.avatar, { backgroundColor: colors.background }]}>
            <MaterialIcons name="person" size={28} color={colors.primary} />
          </View>
          
          <View style={styles.headerInfo}>
            {/* Имя пользователя */}
            <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
              {thread.author?.full_name || 'Аноним'}
            </Text>
            
            {/* Дата */}
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatDate(thread.last_post_at || thread.created_at)}
            </Text>
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialIcons name="visibility" size={16} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.primary }]}>{thread.views}</Text>
          </View>
          
          <View style={styles.stat}>
            <MaterialIcons name="comment" size={16} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.primary }]}>{thread.posts_count}</Text>
          </View>
        </View>
      </View>

      {/* Заголовок топика */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {thread.title}
      </Text>

      {/* Badges */}
      <View style={styles.badges}>
        {thread.is_pinned && (
          <View style={[styles.pinnedBadge, { backgroundColor: colors.background }]}>
            <MaterialIcons name="push-pin" size={12} color={colors.primary} />
            <Text style={[styles.pinnedText, { color: colors.primary }]}>Закріплено</Text>
          </View>
        )}
        
        {thread.is_closed && (
          <View style={[styles.closedBadge, { backgroundColor: colors.background }]}>
            <MaterialIcons name="lock" size={12} color={colors.error} />
            <Text style={[styles.closedText, { color: colors.error }]}>Закрито</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinnedCard: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  authorName: {
    ...Typography.bodyBold,
    marginBottom: 2,
  },
  date: {
    ...Typography.caption,
    fontSize: 11,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 13,
  },
  title: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  pinnedText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  closedText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
});

