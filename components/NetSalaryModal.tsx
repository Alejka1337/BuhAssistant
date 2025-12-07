import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface NetSalaryModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'input' | 'result';

const PDFO_RATE = 0.18; // 18%
const MILITARY_TAX_RATE = 0.05; // 5%

export default function NetSalaryModal({ visible, onClose }: NetSalaryModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [grossSalary, setGrossSalary] = useState('');
  const [result, setResult] = useState<{ pdfo: number; militaryTax: number; netSalary: number } | null>(null);

  const calculateNetSalary = () => {
    const salary = parseFloat(grossSalary);
    if (isNaN(salary) || salary < 0) {
      alert('Будь ласка, введіть коректну суму зарплати.');
      setResult(null);
      return;
    }
    const pdfo = salary * PDFO_RATE;
    const militaryTax = salary * MILITARY_TAX_RATE;
    const netSalary = salary - (pdfo + militaryTax);

    setResult({ pdfo, militaryTax, netSalary });
    setStep('result');
  };
  
  const handleClose = () => {
    setStep('input');
    setResult(null);
    setGrossSalary('');
    onClose();
  };

  const handleBack = () => {
    setStep('input');
  };

  const resetState = () => {
    setStep('input');
    setGrossSalary('');
    setResult(null);
  };

  const renderInputStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.label}>
        Заробітна плата (до вирахування податків) <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={grossSalary}
        onChangeText={setGrossSalary}
        keyboardType="decimal-pad"
        placeholder="Наприклад: 20000"
        placeholderTextColor={Colors.textMuted}
      />
      
      <TouchableOpacity style={styles.calculateButton} onPress={calculateNetSalary}>
        <Text style={styles.calculateButtonText}>Розрахувати</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResultStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.resultHeader}>
        <MaterialIcons name="check-circle" size={48} color={Colors.success} />
        <Text style={styles.resultTitle}>Результат розрахунку</Text>
      </View>

      {result && (
        <>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>ПДФО (18%):</Text>
            <Text style={styles.resultValue}>{result.pdfo.toFixed(2)} грн</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Військовий збір (5%):</Text>
            <Text style={styles.resultValue}>{result.militaryTax.toFixed(2)} грн</Text>
          </View>

          <View style={[styles.resultCard, styles.resultCardMain]}>
            <Text style={styles.resultLabel}>Чиста зарплата:</Text>
            <Text style={[styles.resultValue, styles.resultValueMain]}>
              {result.netSalary.toFixed(2)} грн
            </Text>
          </View>

          <Text style={styles.resultNote}>
            ℹ️ Це орієнтовний розрахунок. Для точних даних зверніться до бухгалтерії.
          </Text>

          <TouchableOpacity style={styles.resetButton} onPress={resetState}>
            <MaterialIcons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.resetButtonText}>Новий розрахунок</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'result' && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Чиста зарплата</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'input' && renderInputStep()}
            {step === 'result' && renderResultStep()}
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
  backButton: {
    padding: Spacing.xs,
    width: 40,
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
    width: 40,
    alignItems: 'flex-end',
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
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
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
  resultHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    fontFamily: Fonts.heading,
  },
  resultCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  resultCardMain: {
    backgroundColor: Colors.primaryLight,
    borderLeftColor: Colors.success,
  },
  resultLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.body,
  },
  resultValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
  },
  resultValueMain: {
    fontSize: Fonts.sizes.xxl,
    color: Colors.textPrimary,
  },
  resultNote: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontFamily: Fonts.body,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.md,
  },
  resetButtonText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontFamily: Fonts.body,
  },
});
