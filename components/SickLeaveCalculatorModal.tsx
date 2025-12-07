/**
 * Калькулятор лікарняних (больничных)
 * Розрахунок виплат за тимчасову непрацездатність
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface SickLeaveCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'input' | 'result';

// Константи для розрахунків
const DAYS_IN_YEAR = 365;
const MIN_AVERAGE_DAILY_WAGE = 262.81;
const MAX_AVERAGE_DAILY_WAGE_LOW_EXPERIENCE = 525.62;
const ABSOLUTE_MAX_AVERAGE_DAILY_WAGE = 3942.18;
const LOW_EXPERIENCE_THRESHOLD = 6; // місяців

export default function SickLeaveCalculatorModal({
  visible,
  onClose,
}: SickLeaveCalculatorModalProps) {
  // State для кроків
  const [step, setStep] = useState<Step>('input');

  // State для полів вводу
  const [income12Months, setIncome12Months] = useState<string>('');
  const [daysOfIncapacity, setDaysOfIncapacity] = useState<string>('0');
  const [sickLeaveDays, setSickLeaveDays] = useState<string>('');
  const [experienceMonths, setExperienceMonths] = useState<string>('');
  const [hasBenefits, setHasBenefits] = useState<boolean>(false);

  // State для результату
  const [result, setResult] = useState<{
    averageDailyWage: number;
    paymentPercentage: number;
    totalAmount: number;
  } | null>(null);

  const resetState = () => {
    setStep('input');
    setIncome12Months('');
    setDaysOfIncapacity('0');
    setSickLeaveDays('');
    setExperienceMonths('');
    setHasBenefits(false);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getPaymentPercentageByExperience = (months: number, isBeneficiary: boolean): number => {
    if (isBeneficiary) {
      return 100;
    }

    if (months < 36) return 50;
    if (months >= 36 && months < 60) return 60;
    if (months >= 60 && months < 96) return 70;
    return 100;
  };

  const calculateSickLeave = () => {
    // Валідація обов'язкових полів
    const income = parseFloat(income12Months);
    const sickDays = parseInt(sickLeaveDays, 10);
    const experience = parseInt(experienceMonths, 10);
    const incapacityDays = parseInt(daysOfIncapacity, 10) || 0;

    if (isNaN(income) || income <= 0) {
      alert('Будь ласка, введіть коректний дохід за 12 місяців');
      return;
    }

    if (isNaN(sickDays) || sickDays <= 0) {
      alert('Будь ласка, введіть коректну кількість днів лікарняного');
      return;
    }

    if (isNaN(experience) || experience < 0) {
      alert('Будь ласка, введіть коректний страховий стаж');
      return;
    }

    // 1. Розрахунок середньоденного заробітку (СДЗ)
    let averageDailyWage = income / (DAYS_IN_YEAR - incapacityDays);

    // 2. Застосування обмежень
    const isLowExperience = experience < LOW_EXPERIENCE_THRESHOLD;

    if (isLowExperience) {
      // Обмеження для малого стажу
      if (averageDailyWage < MIN_AVERAGE_DAILY_WAGE) {
        averageDailyWage = MIN_AVERAGE_DAILY_WAGE;
      } else if (averageDailyWage > MAX_AVERAGE_DAILY_WAGE_LOW_EXPERIENCE) {
        averageDailyWage = MAX_AVERAGE_DAILY_WAGE_LOW_EXPERIENCE;
      }
    } else {
      // Мінімальне обмеження для всіх
      if (averageDailyWage < MIN_AVERAGE_DAILY_WAGE) {
        averageDailyWage = MIN_AVERAGE_DAILY_WAGE;
      }
    }

    // Абсолютний максимум
    if (averageDailyWage > ABSOLUTE_MAX_AVERAGE_DAILY_WAGE) {
      averageDailyWage = ABSOLUTE_MAX_AVERAGE_DAILY_WAGE;
    }

    // 3. Визначення відсотка оплати
    const paymentPercentage = getPaymentPercentageByExperience(experience, hasBenefits);

    // 4. Розрахунок загальної суми
    const totalAmount = averageDailyWage * sickDays * (paymentPercentage / 100);

    setResult({
      averageDailyWage: Math.round(averageDailyWage * 100) / 100,
      paymentPercentage,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
    
    setStep('result');
  };

  const handleBack = () => {
    setStep('input');
  };

  const renderInputStep = () => (
    <View style={styles.formContainer}>
              {/* Дохід за 12 місяців */}
              <Text style={styles.label}>
                Дохід за останні 12 місяців <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Наприклад: 240000"
                keyboardType="decimal-pad"
                value={income12Months}
                onChangeText={setIncome12Months}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Кількість днів непрацездатності */}
              <Text style={styles.label}>Кількість днів непрацездатності за 12 місяців</Text>
              <Text style={styles.hint}>
                Враховуються інші лікарняні, декретні, відпустка за свій рахунок
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="number-pad"
                value={daysOfIncapacity}
                onChangeText={setDaysOfIncapacity}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Кількість днів лікарняного */}
              <Text style={styles.label}>
                Кількість днів лікарняного <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Наприклад: 10"
                keyboardType="number-pad"
                value={sickLeaveDays}
                onChangeText={setSickLeaveDays}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Страховий стаж */}
              <Text style={styles.label}>
                Страховий стаж (місяців) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Наприклад: 48"
                keyboardType="number-pad"
                value={experienceMonths}
                onChangeText={setExperienceMonths}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Пільгова категорія */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setHasBenefits(!hasBenefits)}
              >
                <View style={[styles.checkbox, hasBenefits && styles.checkboxChecked]}>
                  {hasBenefits && <MaterialIcons name="check" size={18} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Наявність пільгової категорії
                </Text>
              </TouchableOpacity>

              {/* Кнопка розрахунку */}
              <TouchableOpacity style={styles.calculateButton} onPress={calculateSickLeave}>
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
            <Text style={styles.resultLabel}>Середньоденний заробіток:</Text>
            <Text style={styles.resultValue}>
              {result.averageDailyWage.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              грн
            </Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Відсоток оплати:</Text>
            <Text style={styles.resultValue}>{result.paymentPercentage}%</Text>
          </View>

          <View style={[styles.resultCard, styles.resultCardMain]}>
            <Text style={styles.resultLabel}>Сума лікарняних:</Text>
            <Text style={[styles.resultValue, styles.resultValueMain]}>
              {result.totalAmount.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              грн
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
            <Text style={styles.title}>Калькулятор лікарняних</Text>
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
  hint: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.body,
    fontStyle: 'italic',
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

