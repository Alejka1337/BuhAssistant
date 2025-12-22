import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getCategories, createThread, ForumCategory } from '@/utils/forumService';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';
import PageWrapper from '@/components/web/PageWrapper';
import { useResponsive } from '@/utils/responsive';
import Select from '@/components/web/Select';
import { ModerationErrorModal } from '@/components/ModerationErrorModal';

export default function CreateThreadWebScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isDesktop, isMobile } = useResponsive();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Moderation error state
  const [moderationError, setModerationError] = useState<{
    reason: string;
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Не вдалося завантажити категорії');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Валидация
    if (!selectedCategory) {
      setError('Оберіть категорію');
      return;
    }

    if (title.trim().length < 5) {
      setError('Заголовок має містити мінімум 5 символів');
      return;
    }

    if (content.trim().length < 10) {
      setError('Зміст має містити мінімум 10 символів');
      return;
    }

    setLoading(true);

    try {
      const newThread = await createThread({
        category_id: selectedCategory,
        title: title.trim(),
        content: content.trim(),
      });

      setSuccess('Топік успішно створено!');
      
      // Перенаправляем на созданный топик через 1 секунду
      setTimeout(() => {
        router.push(`/forum/thread/${newThread.id}` as any);
      }, 1000);
    } catch (error: any) {
      console.error('Error creating thread:', error);
      
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
      
      // Для других ошибок показываем обычное сообщение об ошибке
      setError(error.message || 'Не вдалося створити топік');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loadingCategories) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Завантаження...</Text>
        </View>
      );
    }

    return (
      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        {/* Заголовок только для Desktop */}
        {isDesktop && <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Створити нову тему</Text>}

        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successContainer}>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            <Text style={[styles.successText, { color: colors.primary }]}>{success}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Заголовок теми *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.primary }]}
              placeholder="Введіть заголовок теми"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Зміст теми *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.primary }]}
              placeholder="Опишіть вашу тему детально"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Категорія *</Text>
            <Select
              value={selectedCategory}
              onValueChange={(itemValue: number | undefined) => setSelectedCategory(itemValue)}
              items={categories.map(cat => ({ label: cat.name, value: cat.id }))}
              style={styles.select}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Створити тему</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Mobile Web - с бургер-меню
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <MobileMenu title="Створити нову тему" />
        <MobileMenuWrapper>
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
          >
            {renderContent()}
          </ScrollView>
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

  // Desktop Web - с сайдбаром
  return (
    <PageWrapper showMobileNav={false}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>
      
      {/* Moderation Error Modal */}
      {moderationError && (
        <ModerationErrorModal
          visible={!!moderationError}
          reason={moderationError.reason}
          suggestions={moderationError.suggestions}
          onClose={() => setModerationError(null)}
        />
      )}
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  content: {
    padding: Spacing.md,
  },
  desktopContent: {
    maxWidth: 800,
    marginHorizontal: 'auto' as any,
    width: '100%',
    paddingVertical: 32,
  },
  pageTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 136, 34, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    flex: 1,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    borderWidth: 2,
    outlineStyle: 'none' as any,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  select: {
    marginTop: 0,
  },
  submitButton: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.body,
    color: '#ffffff',
    fontWeight: '600',
  },
});
