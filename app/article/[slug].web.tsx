import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useResponsive } from '@/utils/responsive';
import PageWrapper from '@/components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';
import { getArticleBySlug, deleteArticle, Article } from '@/utils/articleService';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsive();
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  // SEO: Обновление мета-тегов при загрузке статьи
  useEffect(() => {
    if (Platform.OS === 'web' && article && typeof document !== 'undefined') {
      // Обновляем title
      document.title = article.meta_title || article.title;
      
      // Обновляем или создаем meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', article.meta_description || article.excerpt || article.title);
    }
  }, [article]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getArticleBySlug(slug);
      setArticle(data);
    } catch (err: any) {
      console.error('Error loading article:', err);
      setError(err.message || 'Не вдалося завантажити статтю');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    
    setDeleting(true);
    try {
      await deleteArticle(article.id);
      Alert.alert('Успіх', 'Статтю видалено', [
        { text: 'OK', onPress: () => router.push('/articles' as any) },
      ]);
    } catch (error: any) {
      console.error('Error deleting article:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося видалити статтю');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const canEdit = () => {
    if (!user || !article) return false;
    const userRole = (user as any).role?.toUpperCase();
    // Админ может редактировать любые статьи
    if (userRole === 'ADMIN') return true;
    // Модератор может редактировать только свои
    if (userRole === 'MODERATOR' && article.author_id === user.id) return true;
    return false;
  };

  const canDelete = () => {
    if (!user) return false;
    const userRole = (user as any).role?.toUpperCase();
    // Только админ может удалять
    return userRole === 'ADMIN';
  };

  // Scroll to top functionality (только для web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        setShowScrollTop(scrollPosition > 300);
      }
    };

    // Добавляем слушатель на window (работает для web)
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Проверяем при первой загрузке
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (Platform.OS === 'web') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Завантаження статті...</Text>
        </View>
      );
    }

    if (error || !article) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Помилка</Text>
          <Text style={styles.errorText}>{error || 'Статтю не знайдено'}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.articleContainer, isDesktop && styles.articleContainerDesktop]}>
        {/* Cover Image */}
        {article.cover_image && (
          Platform.OS === 'web' ? (
            <img
              src={article.cover_image}
              alt={article.title}
              style={{
                width: '100%',
                height: 300,
                maxHeight: isDesktop ? 500 : 300,
                objectFit: 'cover',
              }}
            />
          ) : (
            <Image
              source={{ uri: article.cover_image }}
              style={[
                styles.coverImage,
                isDesktop && { maxHeight: 500 }
              ]}
              resizeMode="cover"
            />
          )
        )}

        {/* Article Header */}
        <View style={styles.articleHeader}>
          <View style={styles.titleRow}>
            {Platform.OS === 'web' ? (
              <h1 style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: Colors.primary,
                marginBottom: Spacing.md,
                lineHeight: 1.3,
                margin: 0,
              }}>
                {article.title}
              </h1>
            ) : (
              <Text style={styles.articleTitle}>{article.title}</Text>
            )}
            
            {/* Edit/Delete buttons for moderators/admins */}
            {(canEdit() || canDelete()) && (
              <View style={styles.actionButtons}>
                {canEdit() && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/admin/articles/new?slug=${article.slug}` as any)}
                  >
                    <MaterialIcons name="edit" size={20} color={Colors.primary} />
                    <Text style={styles.editButtonText}>Редагувати</Text>
                  </TouchableOpacity>
                )}
                {canDelete() && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <MaterialIcons name="delete" size={20} color={Colors.error} />
                    <Text style={styles.deleteButtonText}>Видалити</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {/* Meta info */}
          <View style={styles.metaContainer}>
            <View style={styles.authorInfo}>
              <MaterialIcons name="person" size={20} color={Colors.textSecondary} />
              <Text style={styles.authorName}>{article.author.full_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={18} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(article.published_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="visibility" size={18} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{article.views} переглядів</Text>
            </View>
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Render HTML content */}
          {Platform.OS === 'web' && (
            <>
              <style>{`
                .article-content {
                  color: ${Colors.textPrimary};
                  font-size: 16px;
                  line-height: 1.8;
                }
                .article-content a {
                  color: ${Colors.textPrimary} !important;
                  text-decoration: underline !important;
                }
                .article-content a:hover {
                  color: ${Colors.primary} !important;
                }
                .article-content h2 {
                  color: ${Colors.primary} !important;
                  font-size: 24px;
                  font-weight: 600;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .article-content img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 1.5rem auto;
                  border-radius: 8px;
                }
              `}</style>
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>
            Останнє оновлення: {formatDate(article.updated_at || article.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  // Mobile Web
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen 
          options={{ 
            headerShown: false,
            title: article ? (article.meta_title || article.title) : 'Стаття',
          }} 
        />
        <MobileMenu 
          title={article?.title || 'Стаття'} 
        />
        <MobileMenuWrapper>
          <ScrollView style={styles.container}>
            {renderContent()}
          </ScrollView>
        </MobileMenuWrapper>
        
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Видалити статтю?"
          message="Цю дію неможливо буде скасувати. Стаття буде видалена назавжди."
          confirmText="Видалити"
          cancelText="Скасувати"
          destructive={true}
          loading={deleting}
          icon="delete"
        />

        {/* Scroll to Top Button */}
        {showScrollTop && Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.scrollToTopButton}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <MaterialIcons name="keyboard-arrow-up" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Desktop Web
  return (
    <PageWrapper showMobileNav={false}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: article ? (article.meta_title || article.title) : 'Стаття',
        }} 
      />
      <ScrollView style={styles.container}>
        {renderContent()}
      </ScrollView>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Видалити статтю?"
        message="Цю дію неможливо буде скасувати. Стаття буде видалена назавжди."
        confirmText="Видалити"
        cancelText="Скасувати"
        destructive={true}
        loading={deleting}
        icon="delete"
      />

      {/* Scroll to Top Button */}
      {showScrollTop && Platform.OS === 'web' && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-up" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  articleContainer: {
    backgroundColor: Colors.cardBackground,
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  articleContainerDesktop: {
    maxWidth: 900,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: 300,
  },
  articleHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  titleRow: {
    marginBottom: Spacing.md,
  },
  articleTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${Colors.error}15`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  scrollToTopButton: {
    position: 'fixed' as any,
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    cursor: 'pointer' as any,
  },
  metaContainer: {
    gap: Spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorName: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginBottom: Spacing.md,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

