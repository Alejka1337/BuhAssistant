import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Theme';

interface MobileSelectProps {
  value: string | null;
  onValueChange: (value: any) => void;
  items: Array<{ label: string; value: any }>;
  placeholder?: string;
}

export default function MobileSelect({ value, onValueChange, items, placeholder = 'Оберіть' }: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(item => item.value === value);
  const displayText = selectedItem?.label || placeholder;

  const handleSelect = (itemValue: any) => {
    onValueChange(itemValue);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.selectButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.selectText, !selectedItem && styles.placeholderText]}>
          {displayText}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <MaterialIcons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {items.map((item) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    key={String(item.value)}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    height: 48,
    width: '100%',
  },
  selectText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  optionsList: {
    padding: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 56,
  },
  optionSelected: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  optionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

