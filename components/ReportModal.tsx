import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
  contentType: 'thread' | 'post';
}

const REPORT_REASONS = [
  { label: 'Спам або реклама', value: 'spam' },
  { label: 'Образливий контент', value: 'offensive' },
  { label: 'Неправдива інформація', value: 'misinformation' },
  { label: 'Недоречний контент', value: 'inappropriate' },
  { label: 'Інше', value: 'other' },
];

export default function ReportModal({ visible, onClose, onSubmit, contentType }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Помилка', 'Оберіть причину скарги');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, details);
      Alert.alert('Успіх', 'Вашу скаргу надіслано. Дякуємо за допомогу у підтримці якості контенту.');
      handleClose();
    } catch (error: any) {
      console.error('Report submission error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося надіслати скаргу. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Поскаржитися</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalText}>
            Оберіть причину скарги на {contentType === 'thread' ? 'топік' : 'коментар'}:
          </Text>

          <View style={styles.reasonsList}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.value && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
                disabled={isSubmitting}
              >
                <View style={styles.radioButton}>
                  {selectedReason === reason.value ? (
                    <MaterialIcons name="radio-button-checked" size={24} color={Colors.primary} />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={24} color={Colors.textMuted} />
                  )}
                </View>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Додаткова інформація (необов'язково)"
            placeholderTextColor={Colors.textMuted}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Скасувати</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={[styles.buttonText, styles.submitButtonText]}>Надіслати</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  reasonsList: {
    marginBottom: Spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background,
  },
  reasonItemSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  radioButton: {
    marginRight: Spacing.sm,
  },
  reasonLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.textMuted + '30',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.textMuted,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  submitButtonText: {
    color: Colors.white,
  },
});
