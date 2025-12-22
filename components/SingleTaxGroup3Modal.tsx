import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface SingleTaxGroup3ModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SingleTaxGroup3Modal({ visible, onClose }: SingleTaxGroup3ModalProps) {
  const [income, setIncome] = useState('');
  const [vatOption, setVatOption] = useState<'with' | 'without' | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const calculateTax = () => {
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue < 0) {
      alert('Будь ласка, введіть коректну суму доходу.');
      setResult(null);
      return;
    }

    if (!vatOption) {
      alert('Будь ласка, оберіть один з варіантів ПДВ.');
      setResult(null);
      return;
    }

    const taxRate = vatOption === 'with' ? 0.03 : 0.05;
    const tax = incomeValue * taxRate;

    const message = `Ставка: ${vatOption === 'with' ? '3%' : '5%'}\nЄдиний податок: ${tax.toFixed(2)} грн.`;
    setResult(message);
  };
  
  const handleClose = () => {
    setResult(null);
    setIncome('');
    setVatOption(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Єдиний податок 3 група</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <Text style={styles.label}>
                Дохід <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="Наприклад: 2400000"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={[styles.label, { marginTop: Spacing.xl }]}>
                Оберіть варіант <Text style={styles.required}>*</Text>
              </Text>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setVatOption('with')}
              >
                <View style={[styles.checkbox, vatOption === 'with' && styles.checkboxChecked]}>
                  {vatOption === 'with' && <MaterialIcons name="check" size={18} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Платник ПДВ (ставка 3%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setVatOption('without')}
              >
                <View style={[styles.checkbox, vatOption === 'without' && styles.checkboxChecked]}>
                  {vatOption === 'without' && <MaterialIcons name="check" size={18} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Без ПДВ (ставка 5%)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.calculateButton} onPress={calculateTax}>
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    flex: 1,
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
