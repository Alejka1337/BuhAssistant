import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCategories,
  getThreads,
  ForumCategory,
  ForumThreadListItem,
} from '@/utils/forumService';
import { getBlockedUserIds } from '@/utils/blockService';
import CategoryCard from '@/components/forum/CategoryCard';
import ThreadCard from '@/components/forum/ThreadCard';

type SortType = 'new' | 'hot' | 'unanswered';

export default function ForumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThreadListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [sortType, setSortType] = useState<SortType>('new');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [blockedUserIds, setBlockedUserIds] = useState<number[]>([]);

  const flatListRef = React.useRef<FlatList>(null);
  const headerHeightRef = React.useRef(0);
  const LIMIT = 20;

  // Загрузка категорий
  useEffect(() => {
    loadCategories();
  }, []);

  // Загрузка топиков при изменении фильтров
  useEffect(() => {
    loadThreads(true);
  }, [selectedCategory, sortType]);

  // Перезагрузка заблокированных пользователей при фокусе на странице
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('🔄 Forum screen focused - reloading blocked users');
        loadBlockedUsersAndRefresh();
      }
    }, [user])
  );

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити категорії');
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const blocked = await getBlockedUserIds();
      console.log('📛 Blocked user IDs loaded in forum list:', blocked);
      setBlockedUserIds(blocked);
      return blocked;
    } catch (error) {
      console.error('Error loading blocked users:', error);
      // В случае ошибки устанавливаем пустой массив
      setBlockedUserIds([]);
      return [];
    }
  };

  const loadBlockedUsersAndRefresh = async () => {
    const blocked = await loadBlockedUsers();
    // После загрузки заблокированных - перезагружаем топики с актуальным списком
    console.log('🔄 Reloading threads after loading blocked users');
    await loadThreads(true, blocked);
  };

  const loadThreads = async (reset: boolean = false, customBlockedIds?: number[]) => {
    // Используем переданный список или текущий из состояния
    const currentBlockedIds = customBlockedIds !== undefined ? customBlockedIds : blockedUserIds;
    if (reset) {
      setLoading(true);
      setThreads([]); // Очищаем список перед загрузкой
      setOffset(0);
      setHasMore(true);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const newOffset = reset ? 0 : offset;
      const data = await getThreads(selectedCategory, sortType, LIMIT, newOffset);
      
      // Фильтруем топики от заблокированных пользователей
      console.log('🔍 Filtering threads. Total:', data.items.length, 'Blocked users:', currentBlockedIds);
      const filteredItems = data.items.filter(item => {
        const userId = item.author?.id;
        const isBlocked = userId ? currentBlockedIds.includes(userId) : false;
        if (isBlocked) {
          console.log('🚫 Hiding thread from blocked user:', userId, item.title);
        }
        return !isBlocked;
      });
      console.log('✅ Filtered threads count:', filteredItems.length);
      
      if (reset) {
        setThreads(filteredItems);
        setOffset(LIMIT); // Устанавливаем offset для следующей загрузки
      } else {
        // Фильтруем дубликаты при добавлении
        setThreads(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newItems = filteredItems.filter(item => !existingIds.has(item.id));
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
      // Скроллим к разделу "Топіки" после загрузки данных
      setTimeout(() => {
        if (flatListRef.current && headerHeightRef.current > 0) {
          // Скроллим к концу header'а минус небольшой отступ
          flatListRef.current.scrollToOffset({ 
            offset: headerHeightRef.current - 60, 
            animated: true 
          });
        }
      }, 400);
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

  const renderHeader = () => (
    <View onLayout={(e) => {
      headerHeightRef.current = e.nativeEvent.layout.height;
    }}>
      {/* Категории */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Категорії</Text>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onPress={handleCategoryPress}
          />
        ))}
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

      {/* Фильтры */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, sortType === 'new' && styles.activeFilter]}
          onPress={() => setSortType('new')}
        >
          <Text style={[styles.filterText, sortType === 'new' && styles.activeFilterText]}>
            Нові
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortType === 'hot' && styles.activeFilter]}
          onPress={() => setSortType('hot')}
        >
          <Text style={[styles.filterText, sortType === 'hot' && styles.activeFilterText]}>
            Гарячі
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortType === 'unanswered' && styles.activeFilter]}
          onPress={() => setSortType('unanswered')}
        >
          <Text style={[styles.filterText, sortType === 'unanswered' && styles.activeFilterText]}>
            Без{'\n'}відповіді
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Топіки</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
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
      <FlatList
        ref={flatListRef}
        data={threads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ThreadCard thread={item} onPress={handleThreadPress} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          threads.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        onEndReached={() => loadThreads(false)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
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
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activeFilter: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeFilterText: {
    color: Colors.white,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
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
});
