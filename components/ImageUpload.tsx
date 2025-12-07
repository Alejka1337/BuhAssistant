import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { API_URL } from '../constants/api';
import { getAccessToken } from '../utils/authService';

interface ImageUploadProps {
  value: string; // URL изображения
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Обкладинка',
  placeholder = 'Натисніть, щоб завантажити зображення',
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);

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
      onChange(fullUrl);
      
      Alert.alert('Успіх', 'Зображення завантажено');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося завантажити зображення');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const handleClick = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {value ? (
        <View style={styles.preview}>
          <Image 
            source={{ uri: value }} 
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
              disabled={uploading}
            >
              <MaterialIcons name="delete" size={20} color={Colors.error} />
              <Text style={styles.removeButtonText}>Видалити</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleClick}
              disabled={uploading}
            >
              <MaterialIcons name="edit" size={20} color={Colors.primary} />
              <Text style={styles.changeButtonText}>Змінити</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={handleClick}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <MaterialIcons name="cloud-upload" size={48} color={Colors.textSecondary} />
              <Text style={styles.placeholder}>{placeholder}</Text>
              <Text style={styles.hint}>PNG, JPG, WEBP до 10 МБ</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect as any}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.borderColor,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    backgroundColor: Colors.cardBackground,
  },
  placeholder: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  preview: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  previewImage: {
    width: '100%',
    height: 300,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.error}15`,
  },
  removeButtonText: {
    ...Typography.button,
    color: Colors.error,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
  },
  changeButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
});

