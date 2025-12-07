// app/news.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { API_ENDPOINTS, getHeaders } from '../constants/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  categories: string[];
  target_audience: string[];
  summary: string;
  published_at: string;
}

export default function NewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;
  
  // Для кнопки "Scroll to Top"
  const flatListRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;
  const scrollTopScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    fetchNews(0, false);
  }, []);

  const fetchNews = async (currentOffset: number, isLoadMore: boolean) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${API_ENDPOINTS.NEWS}?limit=${LIMIT}&offset=${currentOffset}`,
        {
          headers: getHeaders(),
        }
      );
      const data = await response.json();
      
      const newItems = data.items || [];
      
      if (isLoadMore) {
        // Добавляем новые элементы к существующим
        setNews(prev => [...prev, ...newItems]);
      } else {
        // Заменяем все элементы (для refresh)
        setNews(newItems);
      }

      // Проверяем, есть ли еще новости
      setHasMore(newItems.length === LIMIT);
      setOffset(currentOffset + LIMIT);
      
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNews(offset, true);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    fetchNews(0, false);
  }, []);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 300;
    
    if (shouldShow !== showScrollTop) {
      setShowScrollTop(shouldShow);
      
      // Анимация появления/скрытия кнопки
      Animated.parallel([
        Animated.timing(scrollTopOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scrollTopScale, {
          toValue: shouldShow ? 1 : 0.8,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const truncateTitle = (title: string, maxLength: number = 80) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => {
    const handlePress = () => {
      if (Platform.OS === 'web') {
        window.open(item.url, '_blank');
      } else {
        router.push({
          pathname: '/webview',
          params: { url: item.url, title: item.title }
        });
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.newsCard}
        onPress={handlePress}
      >
      <View style={styles.newsHeader}>
        <Text style={styles.newsSource}>{item.source}</Text>
        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.categories[0]}</Text>
          </View>
        )}
      </View>
      <Text style={styles.newsTitle}>{truncateTitle(item.title, 80)}</Text>
      {item.target_audience && item.target_audience.length > 0 && (
        <View style={styles.audienceContainer}>
          {item.target_audience.map((audience, index) => (
            <View key={index} style={styles.audienceBadge}>
              <Text style={styles.audienceText}>{audience}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Завантаження...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#7f8c8d" />
        <Text style={styles.emptyText}>Новин поки немає</Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Всі новини',
          headerStyle: {
            backgroundColor: Colors.cardBackground,
          },
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
    
      
      <View style={styles.container}>
        {loading && news.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Завантаження новин...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={news}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 16 }
            ]}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )}
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Animated.View 
            style={[
              styles.scrollTopButton,
              {
                bottom: insets.bottom + 20,
                opacity: scrollTopOpacity,
                transform: [{ scale: scrollTopScale }],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.scrollTopButtonInner}
              onPress={scrollToTop}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-upward" size={28} color={Colors.white} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
  },
  newsCard: {
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
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  newsSource: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  newsTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  audienceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  audienceBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginRight: 6,
    marginBottom: 4,
  },
  audienceText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  scrollTopButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  scrollTopButtonInner: {
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

