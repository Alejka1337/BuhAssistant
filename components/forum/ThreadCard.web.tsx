// components/forum/ThreadCard.web.tsx - WEB VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ForumThreadListItem } from '../../utils/forumService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

// Inject CSS for smooth transitions
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .forum-thread-card {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
  `;
  if (!document.getElementById('forum-thread-card-styles')) {
    style.id = 'forum-thread-card-styles';
    document.head.appendChild(style);
  }
}

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
  return (
    <TouchableOpacity
      style={[styles.card, thread.is_pinned && styles.pinnedCard]}
      onPress={() => onPress(thread.id)}
      activeOpacity={0.7}
      // @ts-ignore - className для веб
      className="forum-thread-card"
      // @ts-ignore - для веб hover
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = '#1e2126';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = Colors.cardBackground;
      }}
    >
      {/* Header с аватаром и статистикой */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {/* Аватар пользователя */}
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={28} color={Colors.primary} />
          </View>
          
          <View style={styles.headerInfo}>
            {/* Имя пользователя */}
            <Text style={styles.authorName} numberOfLines={1}>
              {thread.author?.full_name || 'Аноним'}
            </Text>
            
            {/* Дата */}
            <Text style={styles.date}>
              {formatDate(thread.last_post_at || thread.created_at)}
            </Text>
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialIcons name="visibility" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{thread.views}</Text>
          </View>
          
          <View style={styles.stat}>
            <MaterialIcons name="comment" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{thread.posts_count}</Text>
          </View>
        </View>
      </View>

      {/* Заголовок топика */}
      <Text style={styles.title} numberOfLines={2}>
        {thread.title}
      </Text>

      {/* Badges */}
      <View style={styles.badges}>
        {thread.is_pinned && (
          <View style={styles.pinnedBadge}>
            <MaterialIcons name="push-pin" size={12} color={Colors.primary} />
            <Text style={styles.pinnedText}>Закріплено</Text>
          </View>
        )}
        
        {thread.is_closed && (
          <View style={styles.closedBadge}>
            <MaterialIcons name="lock" size={12} color={Colors.error} />
            <Text style={styles.closedText}>Закрито</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  pinnedCard: {
    borderWidth: 1,
    borderColor: Colors.primary,
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
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  date: {
    ...Typography.caption,
    color: Colors.textMuted,
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
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  title: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  pinnedText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  closedText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    fontSize: 11,
  },
});

