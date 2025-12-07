// app/(tabs)/forum.web.tsx - WEB VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/utils/responsive';
import {
  getCategories,
  getThreads,
  ForumCategory,
  ForumThreadListItem,
} from '@/utils/forumService';
import CategoryCard from '@/components/forum/CategoryCard.web';
import ThreadCard from '@/components/forum/ThreadCard.web';

type SortType = 'new' | 'hot' | 'unanswered';

export default function ForumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDesktop } = useResponsive();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThreadListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [sortType, setSortType] = useState<SortType>('new');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const topicsHeaderRef = React.useRef<View>(null);
  const [topicsHeaderY, setTopicsHeaderY] = React.useState(0);

  const LIMIT = 20;

  // Загрузка категорий
  useEffect(() => {
    loadCategories();
  }, []);

  // Загрузка топиков при изменении фильтров
  useEffect(() => {
    loadThreads(true);
  }, [selectedCategory, sortType]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити категорії');
    }
  };

  const loadThreads = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setThreads([]);
      setOffset(0);
      setHasMore(true);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const newOffset = reset ? 0 : offset;
      const data = await getThreads(selectedCategory, sortType, LIMIT, newOffset);
      
      if (reset) {
        setThreads(data.items);
        setOffset(LIMIT);
      } else {
        setThreads(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newItems = data.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setOffset(newOffset + LIMIT);
      }

      setHasMore(data.items.length === LIMIT);
    } catch (error) {
      console.error('Error loading threads:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити топіки');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    await loadThreads(true);
    setRefreshing(false);
  }, [selectedCategory, sortType]);

  const handleCategoryPress = (categoryId: number) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(undefined);
    } else {
      setSelectedCategory(categoryId);
      
      // Скролл к разделу топиков только для мобильной веб версии
      if (!isDesktop) {
        setTimeout(() => {
          if (scrollViewRef.current && topicsHeaderY > 0) {
            scrollViewRef.current.scrollTo({ 
              y: topicsHeaderY - 60, 
              animated: true 
            });
          }
        }, 400);
      }
    }
  };

  const handleThreadPress = (threadId: number) => {
    router.push(`/forum/thread/${threadId}` as any);
  };

  const handleCreateThread = () => {
    if (!user) {
      Alert.alert('Необхідна авторизація', 'Щоб створити топік, потрібно увійти в систему');
      return;
    }
    router.push('/forum/create-thread' as any);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadThreads(false);
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Завантаження...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="forum" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyText}>Поки що немає топіків</Text>
        {user && (
          <TouchableOpacity style={styles.createButton} onPress={handleCreateThread}>
            <Text style={styles.createButtonText}>Створити перший топік</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          {/* Заголовок для Desktop */}
          {isDesktop && (
            <Text style={styles.pageTitle}>Форум</Text>
          )}

          {/* Категории */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Категорії</Text>
            <View style={isDesktop ? styles.gridContainer : undefined}>
              {categories.map((category) => (
                <View key={category.id} style={isDesktop ? styles.gridItem : undefined}>
                  <CategoryCard
                    category={category}
                    onPress={handleCategoryPress}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Кнопка создания топика */}
          {user && (
            <TouchableOpacity 
              style={styles.createThreadButton} 
              onPress={handleCreateThread}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color={Colors.white} />
              <Text style={styles.createThreadButtonText}>Додати тему</Text>
            </TouchableOpacity>
          )}

          {/* Топики */}
          <View 
            ref={topicsHeaderRef}
            onLayout={(e) => {
              setTopicsHeaderY(e.nativeEvent.layout.y);
            }}
          >
            <Text style={styles.sectionTitle}>Топіки</Text>
          </View>
          
          {threads.length === 0 ? (
            renderEmpty()
          ) : (
            <View style={isDesktop ? styles.gridContainer : undefined}>
              {threads.map((thread) => (
                <View key={thread.id} style={isDesktop ? styles.gridItem : undefined}>
                  <ThreadCard thread={thread} onPress={handleThreadPress} />
                </View>
              ))}
            </View>
          )}

          {/* Load More Button */}
          {!loading && hasMore && threads.length > 0 && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.loadMoreText}>Завантажити ще</Text>
                  <MaterialIcons name="expand-more" size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  desktopContent: {
    maxWidth: 1440,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
    width: '100%',
  },
  pageTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  gridContainer: {
    display: 'grid' as any,
    gridTemplateColumns: 'repeat(3, 1fr)' as any,
    gap: Spacing.sm,
  },
  gridItem: {
    minWidth: 0, // Prevents grid blowout
  },
  createThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  createThreadButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
    minHeight: 44,
  },
  loadMoreText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
});

