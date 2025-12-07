import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

export interface ActionMenuItem {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionMenuItem[];
}

export default function ActionMenuModal({
  visible,
  onClose,
  title = 'Дії',
  items,
}: ActionMenuModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalView}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
              </View>

              <View style={styles.itemsContainer}>
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      index === items.length - 1 && styles.lastMenuItem,
                    ]}
                    onPress={() => {
                      onClose();
                      setTimeout(() => item.onPress(), 100); // Небольшая задержка для анимации закрытия
                    }}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={24}
                      color={item.destructive ? Colors.error : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        item.destructive && styles.menuItemTextDestructive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  itemsContainer: {
    paddingTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuItemTextDestructive: {
    color: Colors.error,
  },
  cancelButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

