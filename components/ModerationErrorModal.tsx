import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

interface ModerationErrorModalProps {
  visible: boolean;
  reason: string;
  suggestions: string[];
  onClose: () => void;
}

export const ModerationErrorModal: React.FC<ModerationErrorModalProps> = ({
  visible,
  reason,
  suggestions,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="error-outline" size={48} color={Colors.error} />
            </View>
            <Text style={styles.title}>Контент не пройшов модерацію</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Причина */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Причина:</Text>
              <Text style={styles.reason}>{reason}</Text>
            </View>

            {/* Рекомендации */}
            {suggestions && suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Рекомендації:</Text>
                {suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <MaterialIcons 
                      name="check-circle" 
                      size={20} 
                      color={Colors.primary} 
                      style={styles.suggestionIcon}
                    />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Информация */}
            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                Наша AI-система автоматично перевіряє всі повідомлення для підтримки безпечної та комфортної атмосфери в спільноті.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Зрозуміло</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reason: {
    ...Typography.body,
    color: Colors.error,
    lineHeight: 22,
    backgroundColor: `${Colors.error}15`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  suggestionIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  suggestionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
});

