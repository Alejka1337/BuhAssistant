// components/forum/PostItem.web.tsx - WEB VERSION
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ForumPost } from '../../utils/forumService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import LikeButton from './LikeButton';

interface PostItemProps {
  post: ForumPost;
  level: number;
  currentUserId?: number;
  onReply: (postId: number) => void;
  onEdit: (postId: number, content: string) => void;
  onDelete: (postId: number) => void;
  onLike: (postId: number) => void;
  parentPost?: ForumPost;
  onQuoteClick?: (postId: number) => void;
}

const MAX_NESTING_LEVEL = 3;

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
  
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function PostItem({
  post,
  level,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  parentPost,
  onQuoteClick,
}: PostItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isAuthor = currentUserId && post.user_id === currentUserId;
  const canReply = level < MAX_NESTING_LEVEL;
  const isReply = level > 0;
  
  // Локальное состояние для мгновенного обновления UI
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  
  // Флаг для отслеживания оптимистичного обновления
  const isOptimisticUpdate = useRef(false);
  
  // Флаг для предотвращения множественных кликов (debounce)
  const isLiking = useRef(false);

  // Синхронизация локального состояния с props при обновлении
  useEffect(() => {
    if (!isOptimisticUpdate.current) {
      setIsLiked(post.is_liked_by_user || false);
      setLikesCount(post.likes_count || 0);
    } else {
      isOptimisticUpdate.current = false;
    }
  }, [post.is_liked_by_user, post.likes_count, post.id]);

  const handleDelete = () => {
    Alert.alert(
      'Видалити коментар',
      'Ви впевнені, що хочете видалити цей коментар?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => onDelete(post.id),
        },
      ]
    );
  };

  const handleLike = () => {
    if (isLiking.current) {
      console.log('⚠️ Like already in progress, ignoring click');
      return;
    }
    
    isLiking.current = true;
    isOptimisticUpdate.current = true;
    
    // Оптимистичное обновление UI
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    
    // Вызываем callback для обновления на бэкенде
    onLike(post.id);
    
    // Разрешаем следующий клик через 500мс
    setTimeout(() => {
      isLiking.current = false;
    }, 500);
  };

  return (
    <View style={[styles.container, post.replies && post.replies.length > 0 && styles.containerWithReplies]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {/* Аватар */}
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color={Colors.primary} />
          </View>
          
          {/* Имя пользователя */}
          <Text style={styles.authorName}>{post.author?.full_name || 'Аноним'}</Text>
        </View>
        
        {/* Дата справа (зеленая) */}
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(post.created_at)}</Text>
          {post.edited_at && (
            <Text style={styles.edited}> (ред.)</Text>
          )}
        </View>
      </View>

      {/* Цитата родительского комментария (если это ответ) */}
      {isReply && parentPost && (
        <TouchableOpacity 
          style={styles.quote} 
          activeOpacity={0.7}
          onPress={() => onQuoteClick && onQuoteClick(parentPost.id)}
        >
          <View style={styles.quoteLine} />
          <View style={styles.quoteContent}>
            <Text style={styles.quoteAuthor}>{parentPost.author?.full_name || 'Аноним'}</Text>
            <Text style={styles.quoteText} numberOfLines={2}>
              {truncateText(parentPost.content, 100)}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Текст комментария */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Действия */}
      <View style={styles.actions}>
        <LikeButton
          likesCount={likesCount}
          isLiked={isLiked}
          onPress={handleLike}
          disabled={!currentUserId}
        />

        {canReply && currentUserId && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply(post.id)}
          >
            <MaterialIcons name="reply" size={18} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Відповісти</Text>
          </TouchableOpacity>
        )}

        {isAuthor && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(post.id, post.content)}
            >
              <MaterialIcons name="edit" size={18} color={Colors.textSecondary} />
              <Text style={styles.actionText}>Редагувати</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={18} color={Colors.error} />
              <Text style={[styles.actionText, styles.deleteText]}>Видалити</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Рекурсивно отображаем вложенные ответы */}
      {post.replies && post.replies.length > 0 && (
        <View style={styles.replies}>
          {post.replies.map((reply, index) => (
            <View 
              key={reply.id}
              style={index === post.replies!.length - 1 ? styles.lastReply : undefined}
            >
              <PostItem
                post={reply}
                level={level + 1}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                parentPost={post}
                onQuoteClick={onQuoteClick}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md, // Увеличил с sm до md
    marginBottom: Spacing.xs,
  },
  containerWithReplies: {
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md, // Увеличил с sm до md
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm, // Увеличил с xs до sm
  },
  authorName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  edited: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontSize: 11,
  },
  quote: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm, // Увеличил с xs до sm
    marginBottom: Spacing.md, // Увеличил с xs до md
    marginLeft: 12,
  },
  quoteLine: {
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginRight: Spacing.sm, // Увеличил с xs до sm
  },
  quoteContent: {
    flex: 1,
  },
  quoteAuthor: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  quoteText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginLeft: 12,
    marginBottom: Spacing.md, // Увеличил с sm до md
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 4,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  deleteText: {
    color: Colors.error,
  },
  replies: {
    marginTop: Spacing.lg, // Увеличил для пространства между комментариями
    marginLeft: -16, // Изменил с -8 на -16 для выравнивания
  },
  lastReply: {
    marginBottom: -Spacing.xs,
  },
});

