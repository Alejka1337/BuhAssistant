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
import ReportModal from '@/components/ReportModal';
import ActionMenuModal, { ActionMenuItem } from '@/components/ActionMenuModal';
import ConfirmModal from '@/components/ConfirmModal';
import { ModerationErrorModal } from '@/components/ModerationErrorModal';
import { API_ENDPOINTS, getHeaders } from '@/constants/api';
import { getAccessToken } from '@/utils/authService';
import { getBlockedUserIds } from '@/utils/blockService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [thread, setThread] = useState<(ForumThread & { posts: ForumPost[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: number; content: string } | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<number[]>([]);
  
  // Report & Block states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'thread' | 'post';
    id: number;
    userId: number;
  } | null>(null);
  
  // Action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuItems, setActionMenuItems] = useState<ActionMenuItem[]>([]);
  
  // Confirm modal state
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);
  const [blockTargetUser, setBlockTargetUser] = useState<{ id: number; name: string } | null>(null);
  
  // Moderation error state
  const [moderationError, setModerationError] = useState<{
    reason: string;
    suggestions: string[];
  } | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (id) {
      loadThread();
      loadBlockedUsers();
    }
  }, [id]);

  const loadBlockedUsers = async () => {
    if (user) {
      const blocked = await getBlockedUserIds();
      setBlockedUserIds(blocked);
      console.log('Blocked user IDs:', blocked);
    }
  };

  const loadThread = async () => {
    try {
      const data = await getThreadById(Number(id));
      
      // Проверяем, не заблокирован ли автор топика
      if (user && blockedUserIds.includes(data.user_id)) {
        Alert.alert(
          'Контент недоступний',
          'Ви заблокували автора цього топіку. Контент не відображається.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      setThread(data);
      console.log('Thread loaded:', {
        thread_id: data.id,
        thread_user_id: data.user_id,
        current_user_id: user?.id,
        should_show_menu: user && data.user_id !== user.id,
        is_blocked: blockedUserIds.includes(data.user_id)
      });
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
      
      // Проверяем, является ли это ошибкой модерации
      if (error.status === 400 && error.detail) {
        const detail = error.detail;
        if (detail.reason && detail.suggestions) {
          // Показываем модальное окно с ошибкой модерации
          setModerationError({
            reason: detail.reason,
            suggestions: detail.suggestions || [],
          });
          return;
        }
      }
      
      // Для других ошибок показываем обычный Alert
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

  // Фильтруем посты от заблокированных пользователей
  const filterBlockedPosts = (posts: ForumPost[]): ForumPost[] => {
    return posts
      .filter(post => !blockedUserIds.includes(post.user_id))
      .map(post => ({
        ...post,
        replies: post.replies ? filterBlockedPosts(post.replies) : []
      }));
  };

  const handleReport = async (reason: string, details: string) => {
    if (!reportTarget) return;

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token');
      }

      const payload = {
        content_type: reportTarget.type,
        content_id: reportTarget.id,
        reported_user_id: reportTarget.userId,
        reason,
        details,
      };
      
      console.log('Submitting report:', {
        url: API_ENDPOINTS.REPORTS.CREATE,
        payload
      });

      const response = await fetch(API_ENDPOINTS.REPORTS.CREATE, {
        method: 'POST',
        headers: getHeaders({
          'Authorization': `Bearer ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      console.log('Report response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Report error response:', error);
        throw new Error(error.detail || 'Failed to submit report');
      }
      
      const result = await response.json();
      console.log('Report submitted successfully:', result);
    } catch (error: any) {
      console.error('Report error:', error);
      throw error;
    }
  };

  const handleBlockUser = (userId: number, userName: string) => {
    if (!user) {
      Alert.alert('Необхідна авторизація', 'Щоб заблокувати користувача, потрібно увійти в систему');
      return;
    }

    setBlockTargetUser({ id: userId, name: userName });
    setShowConfirmBlock(true);
  };

  const confirmBlockUser = async () => {
    if (!blockTargetUser) return;

    setIsBlocking(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token');
      }

      const payload = { blocked_id: blockTargetUser.id };
      console.log('Blocking user:', {
        url: API_ENDPOINTS.BLOCKS.CREATE,
        payload
      });

      const response = await fetch(API_ENDPOINTS.BLOCKS.CREATE, {
        method: 'POST',
        headers: getHeaders({
          'Authorization': `Bearer ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      console.log('Block response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Block error response:', error);
        throw new Error(error.detail || 'Failed to block user');
      }

      const result = await response.json();
      console.log('User blocked successfully:', result);
      
      setShowConfirmBlock(false);
      setBlockTargetUser(null);
      
      // Обновляем список заблокированных
      await loadBlockedUsers();
      
      Alert.alert('Успіх', 'Користувача заблоковано. Його контент більше не відображатиметься.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Block error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося заблокувати користувача');
    } finally {
      setIsBlocking(false);
    }
  };

  const showPostMenu = (post: ForumPost) => {
    console.log('showPostMenu called for post:', {
      post_id: post.id,
      post_user_id: post.user_id,
      current_user_id: user?.id,
      is_own_post: user && post.user_id === user.id
    });
    
    if (user && post.user_id === user.id) {
      console.log('Skipping menu - own post');
      return; // Не показываем меню для своих постов
    }

    const items: ActionMenuItem[] = [
      {
        label: 'Поскаржитися',
        icon: 'report',
        onPress: () => {
          setReportTarget({
            type: 'post',
            id: post.id,
            userId: post.user_id,
          });
          setShowReportModal(true);
        },
      },
      {
        label: 'Заблокувати користувача',
        icon: 'block',
        destructive: true,
        onPress: () => {
          handleBlockUser(post.user_id, post.author?.full_name || 'Користувач');
        },
      },
    ];

    setActionMenuItems(items);
    setShowActionMenu(true);
  };

  const showThreadMenu = () => {
    if (!thread) return;
    
    if (user && thread.user_id === user.id) {
      return; // Не показываем меню для своих топиков
    }

    const items: ActionMenuItem[] = [
      {
        label: 'Поскаржитися',
        icon: 'report',
        onPress: () => {
          setReportTarget({
            type: 'thread',
            id: thread.id,
            userId: thread.user_id,
          });
          setShowReportModal(true);
        },
      },
      {
        label: 'Заблокувати автора',
        icon: 'block',
        destructive: true,
        onPress: () => {
          handleBlockUser(thread.user_id, thread.author?.full_name || thread.author?.email || 'Користувач');
        },
      },
    ];

    setActionMenuItems(items);
    setShowActionMenu(true);
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
              
              {user && thread.user_id !== user.id && (
                <TouchableOpacity
                  onPress={() => {
                    console.log('Menu button pressed for thread:', thread.id);
                    showThreadMenu();
                  }}
                  style={styles.menuButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="more-vert" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
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
            
            {filterBlockedPosts(thread.posts).map((post) => (
              <PostItem
                key={post.id}
                post={post}
                level={0}
                currentUserId={user?.id}
                onReply={(postId) => handleReply(postId, post.author?.full_name || 'Аноним')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLike={handleLike}
                onMenuPress={() => showPostMenu(post)}
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

          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
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

      {/* Action Menu Modal */}
      <ActionMenuModal
        visible={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        title="Оберіть дію"
        items={actionMenuItems}
      />

      {/* Confirm Block Modal */}
      <ConfirmModal
        visible={showConfirmBlock}
        onClose={() => {
          setShowConfirmBlock(false);
          setBlockTargetUser(null);
        }}
        onConfirm={confirmBlockUser}
        title="Заблокувати користувача?"
        message={`Ви більше не побачите контент від ${blockTargetUser?.name || 'цього користувача'}. Ви зможете розблокувати його в налаштуваннях профілю.`}
        confirmText="Заблокувати"
        cancelText="Скасувати"
        destructive={true}
        loading={isBlocking}
        icon="block"
      />

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTarget(null);
        }}
        onSubmit={handleReport}
        contentType={reportTarget?.type || 'post'}
      />
      
      {/* Moderation Error Modal */}
      {moderationError && (
        <ModerationErrorModal
          visible={!!moderationError}
          reason={moderationError.reason}
          suggestions={moderationError.suggestions}
          onClose={() => setModerationError(null)}
        />
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
  menuButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
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

