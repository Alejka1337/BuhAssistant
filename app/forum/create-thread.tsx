import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { getCategories, createThread, ForumCategory } from '@/utils/forumService';
import { ModerationErrorModal } from '@/components/ModerationErrorModal';

export default function CreateThreadScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
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
      Alert.alert('Помилка', 'Не вдалося завантажити категорії');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (!selectedCategory) {
      Alert.alert('Помилка', 'Оберіть категорію');
      return;
    }

    if (title.trim().length < 5) {
      Alert.alert('Помилка', 'Заголовок має містити мінімум 5 символів');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('Помилка', 'Зміст має містити мінімум 10 символів');
      return;
    }

    setLoading(true);

    try {
      const newThread = await createThread({
        category_id: selectedCategory,
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert('Успіх', 'Топік створено', [
        {
          text: 'OK',
          onPress: () => router.push(`/forum/thread/${newThread.id}` as any),
        },
      ]);
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
      
      // Для других ошибок показываем обычный Alert
      Alert.alert('Помилка', error.message || 'Не вдалося створити топік');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Створити топік',
            headerStyle: { backgroundColor: Colors.cardBackground },
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: 'Створити топік',
          headerStyle: { backgroundColor: Colors.cardBackground },
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

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, styles.firstLabel]}>Заголовок</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Введіть заголовок топіка"
          placeholderTextColor={Colors.textMuted}
          maxLength={255}
        />
        <Text style={styles.hint}>{title.length}/255</Text>

        <Text style={styles.label}>Зміст</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Опишіть ваше питання або тему для обговорення"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Категорія</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            style={styles.picker}
            dropdownIconColor={Colors.textPrimary}
          >
            {categories.map((category) => (
              <Picker.Item
                key={category.id}
                label={category.name}
                value={category.id}
                color={Platform.OS === 'ios' ? Colors.textPrimary : undefined}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Опублікувати</Text>
          )}
        </TouchableOpacity>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  firstLabel: {
    marginTop: Spacing.md,
  },
  pickerContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 150,
    maxHeight: 300,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
});

