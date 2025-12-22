// app/forum/thread/[id].web.tsx - WEB VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/utils/responsive';
import PageWrapper from '@/components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';

// CSS injection will be done inside component with dynamic colors
import {
  getThreadById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  ForumThread,
  ForumPost,
} from '@/utils/forumService';
import PostItem from '@/components/forum/PostItem.web';
import { ModerationErrorModal } from '@/components/ModerationErrorModal';

// Функция для расчета времени с момента создания
function formatTimeAgo(dateString: string): string {
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

export default function ThreadDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isDesktop, isMobile } = useResponsive();

  const [thread, setThread] = useState<(ForumThread & { posts: ForumPost[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: number; content: string } | null>(null);
  
  // Moderation error state
  const [moderationError, setModerationError] = useState<{
    reason: string;
    suggestions: string[];
  } | null>(null);
  
  // Refs для скролла к комментариям
  const postRefs = useRef<{ [key: number]: View | null }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id) {
      loadThread();
    }
  }, [id]);

  // CSS styling removed - using inline styles instead to avoid CSSStyleDeclaration errors

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
        await updatePost(editingPost.id, newComment.trim());
        setEditingPost(null);
      } else {
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

  const handleQuoteClick = (postId: number) => {
    const postElement = postRefs.current[postId];
    if (postElement) {
      postElement.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => {
          console.log('Failed to measure layout');
        }
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {Platform.OS !== 'web' && (
          <Stack.Screen
            options={{
              title: 'Завантаження...',
              headerStyle: { backgroundColor: colors.cardBackground },
              headerTintColor: colors.primary,
              headerTitleStyle: {
                ...Typography.h4,
                // color: dynamic,
              },
            }}
          />
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {Platform.OS !== 'web' && (
          <Stack.Screen
            options={{
              title: 'Помилка',
              headerStyle: { backgroundColor: colors.cardBackground },
              headerTintColor: colors.primary,
              headerTitleStyle: {
                ...Typography.h4,
                // color: dynamic,
              },
            }}
          />
        )}
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Топік не знайдено</Text>
        </View>
      </View>
    );
  }

  // Для Mobile Web - добавляем бургер-меню с названием топика
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <MobileMenu title={thread.title} />
        <MobileMenuWrapper>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
              options={{
                headerShown: false,
              }}
            />

            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {/* Топик */}
              <View style={[styles.threadContainer, { backgroundColor: colors.cardBackground }]}>
                {thread.is_pinned && (
                  <View style={styles.pinnedBadge}>
                    <MaterialIcons name="push-pin" size={16} color={colors.primary} />
                    <Text style={[styles.pinnedText, { color: colors.primary }]}>Закріплено</Text>
                  </View>
                )}

                {/* Убрали название топика, оно теперь в header */}

                <View style={styles.meta}>
                  <View style={styles.author}>
                    <MaterialIcons name="person" size={24} color={colors.primary} />
                    <Text style={[styles.authorText, { color: colors.textPrimary }]}>{thread.author?.full_name || 'Аноним'}</Text>
                  </View>

                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <MaterialIcons name="visibility" size={18} color={colors.primary} />
                      <Text style={[styles.statText, { color: colors.primary }]}>{thread.views}</Text>
                    </View>
                    
                    <View style={styles.stat}>
                      <MaterialIcons name="access-time" size={18} color={colors.primary} />
                      <Text style={[styles.timeAgo, { color: colors.primary }]}>{formatTimeAgo(thread.created_at)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.threadContent, { color: colors.textPrimary }]}>{thread.content}</Text>

                {thread.is_closed && (
                  <View style={[styles.closedBadge, { backgroundColor: colors.background }]}>
                    <MaterialIcons name="lock" size={16} color={colors.error} />
                    <Text style={[styles.closedText, { color: colors.error }]}>Топік закрито для коментарів</Text>
                  </View>
                )}
              </View>

              {/* Комментарии */}
              {thread.posts && thread.posts.length > 0 && (
                <View style={styles.commentsSection}>
                  <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
                    Коментарі ({thread.posts_count})
                  </Text>
                  
                  {thread.posts.map((post) => (
                    <View
                      key={post.id}
                      ref={(ref) => { postRefs.current[post.id] = ref; }}
                      collapsable={false}
                    >
                      <PostItem
                        post={post}
                        level={0}
                        currentUserId={user?.id}
                        onReply={(postId) => handleReply(postId, post.author?.full_name || 'Аноним')}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onLike={handleLike}
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Форма комментария */}
              {user && !thread.is_closed ? (
                <View style={[styles.commentForm, { backgroundColor: colors.cardBackground }]}>
                  <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground }]}>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Напишіть коментар..."
                      placeholderTextColor={colors.textMuted}
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                    />

                    <TouchableOpacity
                      style={[styles.sendButton, { backgroundColor: colors.primary }, commenting && styles.sendButtonDisabled]}
                      onPress={handleSubmitComment}
                      disabled={commenting || !newComment.trim()}
                    >
                      {commenting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <MaterialIcons name="send" size={20} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : !user ? (
                <TouchableOpacity
                  style={[styles.loginPrompt, { backgroundColor: colors.cardBackground }]}
                  onPress={() => router.push('/login')}
                >
                  <Text style={[styles.loginText, { color: colors.primary }]}>
                    Увійдіть, щоб залишити коментар
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </MobileMenuWrapper>
        
        {/* Moderation Error Modal */}
        {moderationError && (
          <ModerationErrorModal
            visible={!!moderationError}
            reason={moderationError.reason}
            suggestions={moderationError.suggestions}
            onClose={() => setModerationError(null)}
          />
        )}
      </View>
    );
  }

  // Для Desktop Web - используем PageWrapper
  return (
    <PageWrapper showMobileNav={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Desktop Header */}
        {isDesktop && (
          <View style={styles.desktopHeader}>
            <Text style={[styles.desktopHeaderTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {thread.title}
            </Text>
          </View>
        )}

        {/* Топик */}
        <View style={[styles.threadContainer, { backgroundColor: colors.cardBackground }, isDesktop && styles.threadContainerDesktop]}>
          {thread.is_pinned && (
            <View style={styles.pinnedBadge}>
              <MaterialIcons name="push-pin" size={16} color={colors.primary} />
              <Text style={[styles.pinnedText, { color: colors.primary }]}>Закріплено</Text>
            </View>
          )}

          {/* Desktop версия - название топика убрано, оно в header */}

          <View style={styles.meta}>
            <View style={styles.author}>
              <MaterialIcons name="person" size={24} color={colors.primary} />
              <Text style={[styles.authorText, { color: colors.textPrimary }]}>{thread.author?.full_name || 'Аноним'}</Text>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <MaterialIcons name="visibility" size={18} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.primary }]}>{thread.views}</Text>
              </View>
              
              <View style={styles.stat}>
                <MaterialIcons name="access-time" size={18} color={colors.primary} />
                <Text style={[styles.timeAgo, { color: colors.primary }]}>{formatTimeAgo(thread.created_at)}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.threadContent, { color: colors.textPrimary }]}>{thread.content}</Text>

          {thread.is_closed && (
            <View style={[styles.closedBadge, { backgroundColor: colors.background }]}>
              <MaterialIcons name="lock" size={16} color={colors.error} />
              <Text style={[styles.closedText, { color: colors.error }]}>Топік закрито для коментарів</Text>
            </View>
          )}
        </View>

        {/* Комментарии */}
        {thread.posts && thread.posts.length > 0 && (
          <View style={[styles.commentsSection, isDesktop && styles.commentsSectionDesktop]}>
            <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
              Коментарі ({thread.posts_count})
            </Text>
            
            {thread.posts.map((post) => (
              <View
                key={post.id}
                ref={(ref) => { postRefs.current[post.id] = ref; }}
                collapsable={false}
              >
                <PostItem
                  post={post}
                  level={0}
                  currentUserId={user?.id}
                  onReply={(postId) => handleReply(postId, post.author?.full_name || 'Аноним')}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onLike={handleLike}
                  onQuoteClick={handleQuoteClick}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Форма комментирования */}
      {user && !thread.is_closed && (
        <View style={[styles.commentForm, { backgroundColor: colors.cardBackground }, isDesktop && styles.commentFormDesktop]}>
          {(replyTo || editingPost) && (
            <View style={[styles.actionBanner, { backgroundColor: colors.background }]}>
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {editingPost
                  ? 'Редагування коментаря'
                  : `Відповідь на коментар ${replyTo?.author}`}
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={editingPost ? 'Редагувати коментар...' : 'Написати коментар...'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }, commenting && styles.sendButtonDisabled]}
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
        <TouchableOpacity 
          style={[styles.loginPrompt, { backgroundColor: colors.cardBackground }, isDesktop && styles.loginPromptDesktop]}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
          // @ts-ignore - className для веб
          className="login-prompt-button"
        >
          <Text style={[styles.loginText, { color: colors.primary }]}>Увійдіть, щоб залишити коментар</Text>
        </TouchableOpacity>
      )}
      
      {/* Moderation Error Modal */}
      {moderationError && (
        <ModerationErrorModal
          visible={!!moderationError}
          reason={moderationError.reason}
          suggestions={moderationError.suggestions}
          onClose={() => setModerationError(null)}
        />
      )}
      </View>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: dynamic,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    // color: dynamic,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  desktopScrollContent: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
  },
  desktopHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  desktopHeaderTitle: {
    ...Typography.h2,
    // color: dynamic,
  },
  threadContainer: {
    // backgroundColor: dynamic,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  threadContainerDesktop: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pinnedText: {
    ...Typography.caption,
    // color: dynamic,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    ...Typography.h3,
    // color: dynamic,
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
    // color: dynamic,
    marginLeft: Spacing.xs,
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
    // color: dynamic,
    fontWeight: '600',
  },
  timeAgo: {
    ...Typography.caption,
    // color: dynamic,
    fontWeight: '600',
    fontSize: 12,
  },
  threadContent: {
    ...Typography.body,
    // color: dynamic,
    lineHeight: 22,
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    // backgroundColor: dynamic,
    borderRadius: BorderRadius.md,
  },
  closedText: {
    ...Typography.body,
    // color: dynamic,
    marginLeft: Spacing.xs,
  },
  commentsSection: {
    padding: Spacing.md,
  },
  commentsSectionDesktop: {
    paddingHorizontal: 0,
  },
  commentsTitle: {
    ...Typography.h4,
    // color: dynamic,
    marginBottom: Spacing.md,
  },
  commentForm: {
    // backgroundColor: dynamic,
    borderTopWidth: 1,
    // borderTopColor: dynamic,
  },
  commentFormDesktop: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto' as any,
    borderRadius: BorderRadius.lg,
    borderTopWidth: 0,
    marginBottom: Spacing.lg,
  },
  actionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    // backgroundColor: dynamic,
  },
  actionText: {
    ...Typography.caption,
    // color: dynamic,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
  },
  input: {
    flex: 1,
    // backgroundColor: dynamic,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Typography.body,
    // color: dynamic,
    maxHeight: 100,
    marginRight: Spacing.xs,
    outlineStyle: 'none' as any,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // backgroundColor: dynamic,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    padding: Spacing.md,
    // backgroundColor: dynamic,
    borderTopWidth: 1,
    // borderTopColor: dynamic,
    alignItems: 'center',
  },
  loginPromptDesktop: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto' as any,
    borderRadius: BorderRadius.lg,
    borderTopWidth: 0,
    marginBottom: Spacing.lg,
  },
  loginText: {
    ...Typography.body,
    // color: dynamic,
  },
});

