import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface SingleTaxGroup1ModalProps {
  visible: boolean;
  onClose: () => void;
}

const ANNUAL_INCOME_LIMIT = 1336000;
const BASE_TAX = 302.80;

export default function SingleTaxGroup1Modal({ visible, onClose }: SingleTaxGroup1ModalProps) {
  const [annualIncome, setAnnualIncome] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculateTax = () => {
    const income = parseFloat(annualIncome);
    if (isNaN(income) || income < 0) {
      alert('Будь ласка, введіть коректну суму доходу.');
      setResult(null);
      return;
    }
    
    let tax = BASE_TAX;
    let message = `Сума єдиного податку (на місяць): ${tax.toFixed(2)} грн.`;

    if (income > ANNUAL_INCOME_LIMIT) {
      tax *= 1.5;
      message = `Дохід перевищує ліміт! Ставка податку збільшена на 50%.\nСума єдиного податку (на місяць): ${tax.toFixed(2)} грн.`;
    }
    
    setResult(message);
  };
  
  const handleClose = () => {
    setResult(null);
    setAnnualIncome('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Єдиний податок 1 група</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <Text style={styles.label}>
                Дохід за рік <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={annualIncome}
                onChangeText={setAnnualIncome}
                keyboardType="decimal-pad"
                placeholder="Наприклад: 1200000"
                placeholderTextColor={Colors.textMuted}
              />
              
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
