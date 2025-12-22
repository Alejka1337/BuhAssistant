import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/utils/responsive';
import PageWrapper from '@/components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';
import { getArticles, ArticleListItem, ArticleListResponse } from '@/utils/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import { PAGE_METAS } from '@/utils/seo';

export default function ArticlesScreen() {
  useSEO(PAGE_METAS.articles);
  const { colors } = useTheme();
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsive();
  const { user } = useAuth();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadArticles();
  }, [page, search]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data: ArticleListResponse = await getArticles(page, 10, search || undefined);
      setArticles(data.articles);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderArticleCard = (article: ArticleListItem) => (
    <TouchableOpacity
      key={article.id}
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={() => router.push(`/article/${article.slug}` as any)}
      activeOpacity={0.7}
    >
      {article.cover_image && (
        <Image
          source={{ uri: article.cover_image }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={2}>
          {article.title}
        </Text>
        {article.excerpt && (
          <Text style={[styles.cardExcerpt, { color: colors.textSecondary }]} numberOfLines={3}>
            {article.excerpt}
          </Text>
        )}
        <View style={styles.cardMeta}>
          <View style={styles.authorInfo}>
            <MaterialIcons name="person" size={16} color={colors.textSecondary} />
            <Text style={[styles.authorName, { color: colors.textSecondary }]}>{article.author.full_name}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="visibility" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{article.views}</Text>
            <Text style={[styles.metaDivider, { color: colors.textMuted }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDate(article.published_at)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading && page === 1) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Завантаження статей...</Text>
        </View>
      );
    }

    return (
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Header - только для десктопа */}
        {isDesktop && (
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Статті</Text>
            {user && ((user as any).role?.toUpperCase() === 'MODERATOR' || (user as any).role?.toUpperCase() === 'ADMIN') && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/admin/articles/new' as any)}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={[styles.createButtonText, { color: colors.white }]}>Створити статтю</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Кнопка создать для мобильных */}
        {isMobile && user && ((user as any).role?.toUpperCase() === 'MODERATOR' || (user as any).role?.toUpperCase() === 'ADMIN') && (
          <View style={styles.mobileCreateButtonContainer}>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/admin/articles/new' as any)}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={[styles.createButtonText, { color: colors.white }]}>Створити статтю</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
            <MaterialIcons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Пошук статей..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleSearch}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <MaterialIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch}>
            <Text style={[styles.searchButtonText, { color: colors.white }]}>Шукати</Text>
          </TouchableOpacity>
        </View>

        {/* Articles count */}
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          Знайдено статей: {total}
        </Text>

        {/* Articles grid */}
        {articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="article" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Статей не знайдено</Text>
            {search && (
              <TouchableOpacity style={[styles.clearSearchButton, { backgroundColor: colors.primary }]} onPress={handleClearSearch}>
                <Text style={[styles.clearSearchText, { color: colors.white }]}>Скинути пошук</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {articles.map(renderArticleCard)}
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={page === 1 ? colors.textMuted : colors.primary}
              />
            </TouchableOpacity>
            <Text style={[styles.pageText, { color: colors.textPrimary }]}>
              Сторінка {page} з {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
              onPress={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={page === totalPages ? colors.textMuted : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Mobile Web
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <MobileMenu title="Статті" />
        <MobileMenuWrapper>
          <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderContent()}
          </ScrollView>
        </MobileMenuWrapper>
      </View>
    );
  }

  // Desktop Web
  return (
    <PageWrapper showMobileNav={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderContent()}
      </ScrollView>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: dynamic,
  },
  content: {
    padding: Spacing.md,
  },
  contentDesktop: {
    maxWidth: 1440,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
  },
  mobileCreateButtonContainer: {
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body,
    // color: dynamic,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    // color: dynamic,
    marginTop: Spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: dynamic,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  createButtonText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  searchInputContainer: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: dynamic,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 2,
    // borderColor: dynamic,
    ...Platform.select({
      web: {
        maxWidth: 500,
      },
    }),
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    // color: dynamic,
    paddingVertical: Spacing.sm,
    outlineStyle: 'none' as any,
  },
  searchButton: {
    // backgroundColor: dynamic,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  searchButtonText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
  countText: {
    ...Typography.caption,
    // color: dynamic,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.h3,
    // color: dynamic,
    marginTop: Spacing.md,
  },
  clearSearchButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    // backgroundColor: dynamic,
    borderRadius: BorderRadius.md,
  },
  clearSearchText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
  grid: {
    gap: Spacing.md,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    // backgroundColor: dynamic,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 380,
      },
      default: {},
    }),
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    // color: dynamic,
    marginBottom: Spacing.sm,
  },
  cardExcerpt: {
    ...Typography.body,
    // color: dynamic,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  cardMeta: {
    gap: Spacing.xs,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  authorName: {
    ...Typography.caption,
    // color: dynamic,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    // color: dynamic,
  },
  metaDivider: {
    ...Typography.caption,
    // color: dynamic,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  pageButton: {
    padding: Spacing.sm,
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
  pageText: {
    ...Typography.body,
    // color: dynamic,
  },
});

