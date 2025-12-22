import React, { useState, useEffect, useRef } from 'react';
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
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/utils/responsive';
import PageWrapper from '@/components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';
import { getArticleBySlug, deleteArticle, Article } from '@/utils/articleService';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import { useSEO } from '@/hooks/useSEO';
import ConsultationModal from '@/components/ConsultationModal.web';

export default function ArticleDetailScreen() {
  const { colors } = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsive();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  // SEO: Обновление мета-тегов при загрузке статьи
  

  // Старый код для совместимости (можно удалить позже)
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

  // Обработчик скролла для ScrollView (Mobile Web)
  const handleScrollViewScroll = (event: any) => {
    if (Platform.OS === 'web') {
      const scrollPosition = event.nativeEvent.contentOffset.y;
      setShowScrollTop(scrollPosition > 300);
    }
  };

  const scrollToTop = () => {
    if (Platform.OS === 'web') {
      // Пробуем прокрутить через ScrollView ref
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      // Также пробуем через window (для случая, если используется обычный скролл)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

  // Обработка шорткодов в контенте статьи
  const processShortcodes = (content: string): string => {
    if (!content) return '';
    
    // Генерируем уникальный ID для каждой кнопки
    const buttonId = `consultation-btn-${Date.now()}`;
    
    // Заменяем [[button]] на HTML кнопку
    const processedContent = content.replace(
      /\[\[button\]\]/gi,
      `<div class="consultation-button-wrapper" style="text-align: center; margin: 2rem 0;">
        <button 
          id="${buttonId}" 
          class="consultation-button"
          style="
            background-color: #282;
            color: white;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          "
          onmouseover="this.style.backgroundColor='#388E3C'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(76, 175, 80, 0.4)';"
          onmouseout="this.style.backgroundColor='#282'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.3)';"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M21 15.46l-5.27-.61-2.52 2.52c-2.83-1.44-5.15-3.75-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z"/>
          </svg>
          Консультація експерта
        </button>
      </div>`
    );
    
    return processedContent;
  };

  // Добавляем обработчик клика на кнопки после рендеринга
  useEffect(() => {
    if (Platform.OS === 'web' && article && typeof document !== 'undefined') {
      // Небольшая задержка, чтобы DOM успел обновиться
      setTimeout(() => {
        const buttons = document.querySelectorAll('.consultation-button');
        buttons.forEach((button) => {
          button.addEventListener('click', () => {
            setShowConsultationModal(true);
          });
        });
      }, 100);
    }
  }, [article]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Завантаження статті...</Text>
        </View>
      );
    }

    if (error || !article) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Помилка</Text>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>{error || 'Статтю не знайдено'}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.articleContainer, { backgroundColor: colors.cardBackground }, isDesktop && styles.articleContainerDesktop]}>
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
        <View style={[styles.articleHeader, { borderBottomColor: colors.borderColor }]}>
          <View style={styles.titleRow}>
            {Platform.OS === 'web' ? (
              <h1 style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: Spacing.md,
                lineHeight: 1.3,
                margin: 0,
              }}>
                {article.title}
              </h1>
            ) : (
              <Text style={[styles.articleTitle, { color: colors.primary }]}>{article.title}</Text>
            )}
            
            {/* Edit/Delete buttons for moderators/admins */}
            {(canEdit() || canDelete()) && (
              <View style={styles.actionButtons}>
                {canEdit() && (
                  <TouchableOpacity
                    style={[styles.editButton, { borderColor: colors.primary }]}
                    onPress={() => router.push(`/admin/articles/new?slug=${article.slug}` as any)}
                  >
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Редагувати</Text>
                  </TouchableOpacity>
                )}
                {canDelete() && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { borderColor: colors.error }]}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <MaterialIcons name="delete" size={20} color={colors.error} />
                    <Text style={[styles.deleteButtonText, { color: colors.error }]}>Видалити</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {/* Meta info */}
          <View style={styles.metaContainer}>
            <View style={styles.authorInfo}>
              <MaterialIcons name="person" size={20} color={colors.textSecondary} />
              <Text style={[styles.authorName, { color: colors.textPrimary }]}>{article.author.full_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={18} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDate(article.published_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="visibility" size={18} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{article.views} переглядів</Text>
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
                  color: ${colors.textPrimary};
                  font-size: 16px;
                  line-height: 1.8;
                }
                .article-content a {
                  color: ${colors.textPrimary} !important;
                  text-decoration: underline !important;
                }
                .article-content a:hover {
                  color: ${colors.primary} !important;
                }
                .article-content h2 {
                  color: ${colors.primary} !important;
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
                dangerouslySetInnerHTML={{ __html: processShortcodes(article.content) }}
              />
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
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
          <ScrollView 
            ref={scrollViewRef}
            style={[styles.container, { backgroundColor: colors.background }]}
            onScroll={handleScrollViewScroll}
            scrollEventThrottle={16}
          >
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
            style={[styles.scrollToTopButton, { backgroundColor: colors.primary }]}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <MaterialIcons name="keyboard-arrow-up" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Consultation Modal */}
        <ConsultationModal
          visible={showConsultationModal}
          onClose={() => setShowConsultationModal(false)}
        />
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
      <ScrollView 
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        onScroll={handleScrollViewScroll}
        scrollEventThrottle={16}
      >
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
          style={[styles.scrollToTopButton, { backgroundColor: colors.primary }]}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-up" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Consultation Modal */}
      <ConsultationModal
        visible={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
      />
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  loadingText: {
    ...Typography.body,
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
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
  },
  articleContainer: {
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
  },
  titleRow: {
    marginBottom: Spacing.md,
  },
  articleTitle: {
    ...Typography.h1,
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
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  deleteButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  scrollToTopButton: {
    position: 'fixed' as any,
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
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
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
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
    marginBottom: Spacing.md,
  },
  footerText: {
    ...Typography.caption,
    textAlign: 'center',
  },
});

