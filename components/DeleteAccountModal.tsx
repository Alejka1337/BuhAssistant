import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
}

export default function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  userEmail,
}: DeleteAccountModalProps) {
  const [email, setEmail] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isValid = email.toLowerCase() === userEmail.toLowerCase() && understood;

  const handleConfirm = async () => {
    if (!isValid) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      // Модальное окно закроется автоматически после успешного удаления
    } catch (error) {
      console.error('Delete account error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setEmail('');
      setUnderstood(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="warning" size={48} color={Colors.error} />
              <Text style={styles.title}>Ви впевнені?</Text>
            </View>

            {/* Warning Text */}
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>Це незворотна дія!</Text>
              <Text style={styles.warningText}>
                Після видалення облікового запису:
              </Text>
              <View style={styles.warningList}>
                <View style={styles.warningItem}>
                  <MaterialIcons name="close" size={16} color={Colors.error} />
                  <Text style={styles.warningItemText}>
                    Усі ваші дані будуть видалені назавжди
                  </Text>
                </View>
                <View style={styles.warningItem}>
                  <MaterialIcons name="close" size={16} color={Colors.error} />
                  <Text style={styles.warningItemText}>
                    Усі топіки та коментарі у форумі будуть видалені
                  </Text>
                </View>
                <View style={styles.warningItem}>
                  <MaterialIcons name="close" size={16} color={Colors.error} />
                  <Text style={styles.warningItemText}>
                    Налаштування та персоналізація будуть втрачені
                  </Text>
                </View>
                <View style={styles.warningItem}>
                  <MaterialIcons name="close" size={16} color={Colors.error} />
                  <Text style={styles.warningItemText}>
                    Неможливо буде відновити обліковий запис
                  </Text>
                </View>
              </View>
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setUnderstood(!understood)}
              disabled={isDeleting}
            >
              <View style={[styles.checkboxBox, understood && styles.checkboxBoxChecked]}>
                {understood && <MaterialIcons name="check" size={18} color={Colors.white} />}
              </View>
              <Text style={styles.checkboxText}>
                Я розумію, що це незворотна дія
              </Text>
            </TouchableOpacity>

            {/* Email Confirmation */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Для підтвердження введіть вашу електронну пошту:
              </Text>
              <Text style={styles.emailHint}>{userEmail}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Введіть email"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isDeleting}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.deleteButton,
                  !isValid && styles.deleteButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!isValid || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>Видалити назавжди</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  warningSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningTitle: {
    ...Typography.h4,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  warningText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  warningList: {
    gap: Spacing.sm,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  warningItemText: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emailHint: {
    ...Typography.caption,
    color: Colors.primary,
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
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.textMuted,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  deleteButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});

