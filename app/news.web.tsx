// app/news.web.tsx - WEB VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS, getHeaders } from '../constants/api';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import PageWrapper from '../components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '../components/web/MobileMenu';
import { useResponsive } from '../utils/responsive';
import HoverCard from '../components/web/HoverCard';

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
  const { isDesktop, isMobile } = useResponsive();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchNews(currentPage);
  }, [currentPage]);

  const fetchNews = async (page: number) => {
    try {
      setLoading(true);
      const offset = (page - 1) * ITEMS_PER_PAGE;

      const response = await fetch(
        `${API_ENDPOINTS.NEWS}?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: getHeaders(),
        }
      );
      const data = await response.json();
      
      const newItems = data.items || [];
      setNews(newItems);
      
      // Вычисляем общее количество страниц
      // Если вернулось меньше чем ITEMS_PER_PAGE, значит это последняя страница
      if (newItems.length < ITEMS_PER_PAGE) {
        setTotalPages(page);
      } else {
        // Предполагаем что есть еще страницы
        setTotalPages(page + 1);
      }
      
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(prev => prev + 1);
      // Прокручиваем наверх
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      setCurrentPage(prev => prev - 1);
      // Прокручиваем наверх
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const truncateTitle = (title: string, maxLength: number = 80) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleNewsPress = (item: NewsItem) => {
    window.open(item.url, '_blank');
  };

  // Для Mobile Web - добавляем бургер-меню
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <MobileMenu title="Всі новини" />
        <MobileMenuWrapper>
          <View style={styles.container}>
            <ScrollView 
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
              <View style={styles.content}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Завантаження новин...</Text>
                  </View>
                ) : news.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="article" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Новин поки немає</Text>
                  </View>
                ) : (
                  <>
                    {/* Сетка новостей */}
                    <View style={styles.newsGrid}>
                      {news.map((item) => (
                        <HoverCard
                          key={item.id}
                          style={styles.newsCard}
                          hoverStyle={styles.newsCardHover}
                          onPress={() => handleNewsPress(item)}
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
                          <Text style={styles.newsDate}>{formatDate(item.published_at)}</Text>
                        </HoverCard>
                      ))}
                    </View>

                    {/* Пагинация */}
                    <View style={styles.pagination}>
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                        onPress={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                          Назад
                        </Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.paginationText}>
                        Сторінка {currentPage} з {totalPages}
                      </Text>
                      
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                        onPress={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                          Далі
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </MobileMenuWrapper>
      </View>
    );
  }

  // Для Desktop Web - используем PageWrapper
  return (
    <PageWrapper showMobileNav={false}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          <View style={[styles.content, isDesktop && styles.desktopContent]}>
            {/* Заголовок */}
            <Text style={styles.pageTitle}>Всі новини</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Завантаження новин...</Text>
            </View>
          ) : news.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="article" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Новин поки немає</Text>
            </View>
          ) : (
            <>
              {/* Сетка новостей */}
              <View style={[styles.newsGrid, isDesktop && styles.newsGridDesktop]}>
                {news.map((item) => (
                  <HoverCard
                    key={item.id}
                    style={styles.newsCard}
                    hoverStyle={styles.newsCardHover}
                    onPress={() => handleNewsPress(item)}
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
                  </HoverCard>
                ))}
              </View>

              {/* Пагинация */}
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    currentPage === 1 && styles.paginationButtonDisabled
                  ]}
                  onPress={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                >
                  <MaterialIcons 
                    name="chevron-left" 
                    size={24} 
                    color={currentPage === 1 ? Colors.textMuted : Colors.primary} 
                  />
                  <Text style={[
                    styles.paginationButtonText,
                    currentPage === 1 && styles.paginationButtonTextDisabled
                  ]}>
                    Назад
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageInfo}>
                  <Text style={styles.pageInfoText}>
                    Сторінка {currentPage} {totalPages > currentPage && `з ${totalPages}+`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    (news.length < ITEMS_PER_PAGE) && styles.paginationButtonDisabled
                  ]}
                  onPress={handleNextPage}
                  disabled={news.length < ITEMS_PER_PAGE || loading}
                >
                  <Text style={[
                    styles.paginationButtonText,
                    (news.length < ITEMS_PER_PAGE) && styles.paginationButtonTextDisabled
                  ]}>
                    Далі
                  </Text>
                  <MaterialIcons 
                    name="chevron-right" 
                    size={24} 
                    color={(news.length < ITEMS_PER_PAGE) ? Colors.textMuted : Colors.primary} 
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
          </View>
        </ScrollView>
      </View>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
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
  newsGrid: {
    gap: Spacing.md,
  },
  newsGridDesktop: {
    display: 'grid' as any,
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: Spacing.md,
  },
  newsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsCardHover: {
    backgroundColor: '#1e2126',
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
  newsDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  paginationText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  paginationButtonDisabled: {
    borderColor: Colors.textMuted,
    opacity: 0.5,
  },
  paginationButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: Colors.textMuted,
  },
  pageInfo: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  pageInfoText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

