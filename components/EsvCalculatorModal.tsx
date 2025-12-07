import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface EsvCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EsvCalculatorModal({ visible, onClose }: EsvCalculatorModalProps) {
  const [minSalary, setMinSalary] = useState('8000');
  const [result, setResult] = useState<string | null>(null);

  const calculateESV = () => {
    const salary = parseFloat(minSalary);
    if (isNaN(salary) || salary <= 0) {
      alert('Будь ласка, введіть коректне значення зарплати.');
      setResult(null);
      return;
    }
    const esv = salary * 0.22;
    setResult(`Сума ЄСВ: ${esv.toFixed(2)} грн`);
  };
  
  const handleClose = () => {
    setResult(null);
    setMinSalary('8000');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ЄСВ для ФОП</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <Text style={styles.label}>
                Мінімальна зарплата <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={minSalary}
                onChangeText={setMinSalary}
                keyboardType="decimal-pad"
                placeholder="Наприклад: 8000"
                placeholderTextColor={Colors.textMuted}
              />
              
              <TouchableOpacity style={styles.calculateButton} onPress={calculateESV}>
                <Text style={styles.calculateButtonText}>Розрахувати</Text>
              </TouchableOpacity>

              {result && (
                <View style={styles.resultContainer}>
                  <MaterialIcons name="check-circle" size={32} color={Colors.success} />
                  <Text style={styles.resultText}>{result}</Text>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flexShrink: 1,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    fontFamily: Fonts.body,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.md,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  calculateButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  calculateButtonText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semibold as any,
    color: '#FFFFFF',
    fontFamily: Fonts.body,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  resultText: {
    marginTop: Spacing.md,
    fontSize: Fonts.sizes.base,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontFamily: Fonts.body,
    lineHeight: 24,
  },
});
