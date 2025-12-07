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
  Platform,
  Switch,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useResponsive } from '@/utils/responsive';
import PageWrapper from '@/components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';
import { 
  createArticle, 
  updateArticle, 
  getArticleBySlug,
  Article 
} from '@/utils/articleService';
import { getAccessToken } from '@/utils/authService';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { SuccessModal } from '@/components/SuccessModal';
import { ImageUpload } from '@/components/ImageUpload';

export default function NewArticleScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { isMobile, isDesktop } = useResponsive();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [existingArticle, setExistingArticle] = useState<Article | null>(null);
  
  // Success modal state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ title: string; message: string; redirectSlug?: string } | null>(null);
  
  // Image upload for content
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const contentImageInputRef = useRef<HTMLInputElement | null>(null);

  const isEditMode = !!slug;

  useEffect(() => {
    // Проверка прав доступа
    if (!user || ((user as any).role?.toUpperCase() !== 'MODERATOR' && (user as any).role?.toUpperCase() !== 'ADMIN')) {
      Alert.alert('Помилка', 'У вас немає прав для створення статей');
      router.back();
      return;
    }

    // Загрузка статьи для редактирования
    if (isEditMode && slug) {
      loadArticle();
    }
  }, [slug, user]);

  const loadArticle = async () => {
    try {
      setLoadingArticle(true);
      const data = await getArticleBySlug(slug!);
      setExistingArticle(data);
      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt || '');
      setMetaTitle(data.meta_title || '');
      setMetaDescription(data.meta_description || '');
      setCoverImage(data.cover_image || '');
      setIsPublished(data.is_published);
    } catch (error: any) {
      console.error('Error loading article:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити статтю');
      router.back();
    } finally {
      setLoadingArticle(false);
    }
  };

  const insertHtmlTag = (tag: string) => {
    // Простая вставка HTML тегов
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    setContent(content + openTag + closeTag);
  };

  const handleContentImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      Alert.alert('Помилка', 'Виберіть файл зображення');
      return;
    }

    // Проверка размера (10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      Alert.alert('Помилка', 'Розмір файлу не повинен перевищувати 10 МБ');
      return;
    }

    setUploadingContentImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = await getAccessToken();
      if (!token) {
        Alert.alert('Помилка', 'Необхідна авторизація');
        return;
      }

      const response = await fetch(`${API_URL}/api/uploads/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Помилка завантаження');
      }

      const data = await response.json();
      
      // Формируем полный URL
      const fullUrl = `${API_URL}${data.url}`;
      
      // Вставляем тег <img> в позицию курсора или в конец контента
      const imgTag = `\n<img src="${fullUrl}" alt="Зображення" style="max-width: 100%; height: auto; margin: 1rem 0;" />\n`;
      setContent(prevContent => prevContent + imgTag);
      
      Alert.alert('Успіх', 'Зображення вставлено в контент');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося завантажити зображення');
    } finally {
      setUploadingContentImage(false);
      // Сброс значения input для возможности загрузить тот же файл снова
      if (contentImageInputRef.current) {
        contentImageInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (title.trim().length < 5) {
      Alert.alert('Помилка', 'Заголовок має містити мінімум 5 символів');
      return;
    }

    if (content.trim().length < 50) {
      Alert.alert('Помилка', 'Зміст має містити мінімум 50 символів');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && existingArticle) {
        // Обновление существующей статьи
        await updateArticle(existingArticle.id, {
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || undefined,
          meta_title: metaTitle.trim() || undefined,
          meta_description: metaDescription.trim() || undefined,
          cover_image: coverImage.trim() || undefined,
          is_published: isPublished,
        });
        setSuccessData({
          title: 'Успіх!',
          message: 'Статтю успішно оновлено',
        });
        setShowSuccess(true);
      } else {
        // Создание новой статьи
        const newArticle = await createArticle({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || undefined,
          meta_title: metaTitle.trim() || undefined,
          meta_description: metaDescription.trim() || undefined,
          cover_image: coverImage.trim() || undefined,
          is_published: isPublished,
        });
        setSuccessData({
          title: 'Успіх!',
          message: 'Статтю успішно створено',
          redirectSlug: newArticle.slug,
        });
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error('Error saving article:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося зберегти статтю');
    } finally {
      setLoading(false);
    }
  };

  const renderEditor = () => (
    <View style={[styles.content, isDesktop && styles.contentDesktop]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? 'Редагувати статтю' : 'Нова стаття'}
        </Text>
      </View>

      {loadingArticle ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Заголовок *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Введіть заголовок статті..."
              placeholderTextColor={Colors.textMuted}
              maxLength={255}
            />
            <Text style={styles.hint}>{title.length}/255</Text>
          </View>

          {/* Excerpt */}
          <View style={styles.field}>
            <Text style={styles.label}>Короткий опис (опціонально)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="Короткий опис для списку статей..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text style={styles.hint}>{excerpt.length}/500</Text>
          </View>

          {/* SEO Section */}
          <View style={styles.seoSection}>
            <Text style={styles.sectionTitle}>🔍 SEO налаштування</Text>
            
            {/* Meta Title */}
            <View style={styles.field}>
              <Text style={styles.label}>SEO Title (опціонально)</Text>
              <TextInput
                style={styles.input}
                value={metaTitle}
                onChangeText={setMetaTitle}
                placeholder="Якщо не вказано, використовується заголовок статті"
                placeholderTextColor={Colors.textMuted}
                maxLength={255}
              />
              <Text style={styles.hint}>
                {metaTitle.length > 0 ? `${metaTitle.length}/255` : 'За замовчуванням: заголовок статті'}
              </Text>
            </View>

            {/* Meta Description */}
            <View style={styles.field}>
              <Text style={styles.label}>SEO Description (опціонально)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={metaDescription}
                onChangeText={setMetaDescription}
                placeholder="Короткий опис для пошукових систем (Google, Bing)..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.hint}>{metaDescription.length}/500</Text>
            </View>
          </View>

          {/* Cover Image */}
          <ImageUpload
            value={coverImage}
            onChange={setCoverImage}
            label="Обкладинка статті (опціонально)"
            placeholder="Натисніть або перетягніть зображення сюди"
          />

          {/* HTML Editor Toolbar */}
          <View style={styles.field}>
            <View style={styles.editorHeader}>
              <Text style={styles.label}>Зміст (HTML) *</Text>
              <View style={styles.editorActions}>
                {/* Кнопка загрузки изображения */}
                <TouchableOpacity
                  style={[styles.uploadImageButton, uploadingContentImage && styles.uploadImageButtonDisabled]}
                  onPress={() => contentImageInputRef.current?.click()}
                  disabled={uploadingContentImage}
                >
                  {uploadingContentImage ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <MaterialIcons name="image" size={20} color={Colors.primary} />
                      <Text style={styles.uploadImageButtonText}>Додати зображення</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {/* Кнопка предпросмотра */}
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => setShowPreview(!showPreview)}
                >
                  <MaterialIcons
                    name={showPreview ? 'edit' : 'visibility'}
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.previewButtonText}>
                    {showPreview ? 'Редагувати' : 'Попередній перегляд'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Hidden file input for content images */}
            {Platform.OS === 'web' && (
              <input
                ref={contentImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleContentImageUpload as any}
              />
            )}

            {!showPreview && (
              <>
                <View style={styles.toolbar}>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('h2')}
                  >
                    <Text style={styles.toolbarButtonText}>H2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('h3')}
                  >
                    <Text style={styles.toolbarButtonText}>H3</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('p')}
                  >
                    <Text style={styles.toolbarButtonText}>P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('strong')}
                  >
                    <Text style={styles.toolbarButtonText}>B</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('em')}
                  >
                    <Text style={styles.toolbarButtonText}>I</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('ul')}
                  >
                    <Text style={styles.toolbarButtonText}>UL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertHtmlTag('li')}
                  >
                    <Text style={styles.toolbarButtonText}>LI</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.input, styles.editor]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="<p>Введіть зміст статті у форматі HTML...</p>"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </>
            )}

            {showPreview && Platform.OS === 'web' && (
              <View style={styles.preview}>
                <div
                  style={{
                    color: Colors.textPrimary,
                    fontSize: 16,
                    lineHeight: 1.8,
                    padding: Spacing.md,
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </View>
            )}

            <Text style={styles.hint}>{content.length} символів</Text>
          </View>

          {/* Publish Toggle */}
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Опублікувати статтю</Text>
                <Text style={styles.switchHint}>
                  {isPublished
                    ? 'Стаття буде видима всім користувачам'
                    : 'Стаття буде збережена як чернетка'}
                </Text>
              </View>
              <Switch
                value={isPublished}
                onValueChange={setIsPublished}
                trackColor={{ false: Colors.borderColor, true: Colors.primaryLight }}
                thumbColor={isPublished ? Colors.primary : Colors.textMuted}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Оновити' : 'Створити'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  // Mobile Web
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <MobileMenu title={isEditMode ? 'Редагувати' : 'Нова стаття'} />
        <MobileMenuWrapper>
          <ScrollView style={styles.container}>
            {renderEditor()}
          </ScrollView>
        </MobileMenuWrapper>
        
        {/* Success Modal */}
        {successData && (
          <SuccessModal
            visible={showSuccess}
            title={successData.title}
            message={successData.message}
            buttonText="Переглянути статтю"
            onClose={() => {
              setShowSuccess(false);
              if (successData.redirectSlug) {
                router.push(`/article/${successData.redirectSlug}` as any);
              } else {
                router.push('/articles' as any);
              }
            }}
          />
        )}
      </View>
    );
  }

  // Desktop Web
  return (
    <PageWrapper showMobileNav={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        {renderEditor()}
      </ScrollView>
      
      {/* Success Modal */}
      {successData && (
        <SuccessModal
          visible={showSuccess}
          title={successData.title}
          message={successData.message}
          buttonText="Переглянути статтю"
          onClose={() => {
            setShowSuccess(false);
            if (successData.redirectSlug) {
              router.push(`/article/${successData.redirectSlug}` as any);
            } else {
              router.push('/articles' as any);
            }
          }}
        />
      )}
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
  contentDesktop: {
    maxWidth: 1000,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  seoSection: {
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  textArea: {
    minHeight: 80,
    maxHeight: 150,
  },
  editor: {
    minHeight: 400,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  editorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  uploadImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  uploadImageButtonDisabled: {
    opacity: 0.5,
  },
  uploadImageButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  previewButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
  },
  toolbarButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  toolbarButtonText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  preview: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    minHeight: 400,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  switchHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
});

