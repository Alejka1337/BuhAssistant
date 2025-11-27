import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  getThreadById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  ForumThread,
  ForumPost,
} from '@/utils/forumService';
import PostItem from '@/components/forum/PostItem';
import LikeButton from '@/components/forum/LikeButton';

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [thread, setThread] = useState<(ForumThread & { posts: ForumPost[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: number; content: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadThread();
    }
  }, [id]);

  const loadThread = async () => {
    try {
      const data = await getThreadById(Number(id));
      setThread(data);
    } catch (error) {
      console.error('Error loading thread:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити топік');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadThread();
  };

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert('Необхідна авторизація', 'Щоб залишити коментар, потрібно увійти в систему');
      return;
    }

    if (newComment.trim().length === 0) {
      Alert.alert('Помилка', 'Коментар не може бути порожнім');
      return;
    }

    setCommenting(true);

    try {
      if (editingPost) {
        // Редактирование
        await updatePost(editingPost.id, newComment.trim());
        setEditingPost(null);
      } else {
        // Создание нового комментария
        await createPost({
          thread_id: Number(id),
          content: newComment.trim(),
          parent_id: replyTo?.id,
        });
        setReplyTo(null);
      }

      setNewComment('');
      await loadThread();
    } catch (error: any) {
      console.error('Error posting comment:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося опублікувати коментар');
    } finally {
      setCommenting(false);
    }
  };

  const handleReply = (postId: number, authorName: string) => {
    if (!user) {
      Alert.alert('Необхідна авторизація', 'Щоб відповісти, потрібно увійти в систему');
      return;
    }
    setReplyTo({ id: postId, author: authorName });
    setEditingPost(null);
    setNewComment('');
  };

  const handleEdit = (postId: number, content: string) => {
    setEditingPost({ id: postId, content });
    setReplyTo(null);
    setNewComment(content);
  };

  const handleDelete = async (postId: number) => {
    try {
      await deletePost(postId);
      await loadThread();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося видалити коментар');
    }
  };

  const handleLike = async (postId: number) => {
    if (!user) {
      Alert.alert('Необхідна авторизація', 'Щоб поставити лайк, потрібно увійти в систему');
      return;
    }

    try {
      await toggleLike(postId);
      await loadThread();
    } catch (error: any) {
      console.error('Error toggling like:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося поставити лайк');
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
    setEditingPost(null);
    setNewComment('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Завантаження...',
            headerStyle: { backgroundColor: Colors.cardBackground },
            headerTintColor: Colors.primary,
            headerTitleStyle: {
              ...Typography.h4,
              color: Colors.textPrimary,
            },
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => router.back()}
                style={{ marginLeft: 16 }}
              >
                <MaterialIcons name="arrow-back-ios" size={24} color={Colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Помилка',
            headerStyle: { backgroundColor: Colors.cardBackground },
            headerTintColor: Colors.primary,
            headerTitleStyle: {
              ...Typography.h4,
              color: Colors.textPrimary,
            },
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => router.back()}
                style={{ marginLeft: 16 }}
              >
                <MaterialIcons name="arrow-back-ios" size={24} color={Colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <Text style={styles.errorText}>Топік не знайдено</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: thread.category_name ? `Категорія: ${thread.category_name}` : 'Топік',
          headerStyle: { backgroundColor: Colors.cardBackground },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            ...Typography.h4,
            color: Colors.textPrimary,
          },
          headerBackTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <MaterialIcons name="arrow-back-ios" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Топик */}
        <View style={styles.threadContainer}>
          {thread.is_pinned && (
            <View style={styles.pinnedBadge}>
              <MaterialIcons name="push-pin" size={16} color={Colors.primary} />
              <Text style={styles.pinnedText}>Закріплено</Text>
            </View>
          )}

          <Text style={styles.title}>Тема: {thread.title}</Text>

          <View style={styles.meta}>
            <View style={styles.author}>
              <MaterialIcons name="person" size={24} color={Colors.primary} />
              <Text style={styles.authorText}>{thread.author?.full_name || 'Аноним'}</Text>
            </View>

            <View style={styles.stats}>
              <MaterialIcons name="visibility" size={18} color={Colors.primary} />
              <Text style={styles.statText}>{thread.views}</Text>
            </View>
          </View>

          <Text style={styles.threadContent}>{thread.content}</Text>

          {thread.is_closed && (
            <View style={styles.closedBadge}>
              <MaterialIcons name="lock" size={16} color={Colors.error} />
              <Text style={styles.closedText}>Топік закрито для коментарів</Text>
            </View>
          )}
        </View>

        {/* Комментарии */}
        {thread.posts && thread.posts.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Коментарі ({thread.posts_count})
            </Text>
            
            {thread.posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                level={0}
                currentUserId={user?.id}
                onReply={(postId) => handleReply(postId, post.author?.full_name || 'Аноним')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLike={handleLike}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Форма комментирования */}
      {user && !thread.is_closed && (
        <View style={styles.commentForm}>
          {(replyTo || editingPost) && (
            <View style={styles.actionBanner}>
              <Text style={styles.actionText}>
                {editingPost
                  ? 'Редагування коментаря'
                  : `Відповідь на коментар ${replyTo?.author}`}
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={editingPost ? 'Редагувати коментар...' : 'Написати коментар...'}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendButton, commenting && styles.sendButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={commenting || newComment.trim().length === 0}
            >
              {commenting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!user && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Увійдіть, щоб залишити коментар</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
  },
  threadContainer: {
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pinnedText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  threadContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  closedText: {
    ...Typography.body,
    color: Colors.error,
    marginLeft: Spacing.xs,
  },
  commentsSection: {
    padding: Spacing.md,
  },
  commentsTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  commentForm: {
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Typography.body,
    color: Colors.textPrimary,
    maxHeight: 100,
    marginRight: Spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  loginText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

