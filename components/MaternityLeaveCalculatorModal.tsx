/**
 * Калькулятор декретних (відпустка у зв'язку з вагітністю та пологами)
 * Розрахунок виплат за декретну відпустку
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

interface MaternityLeaveCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'input' | 'result';
type MaternityDays = 126 | 140 | 180;

// Константи для розрахунків
const DAYS_IN_YEAR = 365;
const MIN_AVERAGE_DAILY_WAGE = 262.81;
const MAX_AVERAGE_DAILY_WAGE_LOW_EXPERIENCE = 525.62;
const ABSOLUTE_MAX_AVERAGE_DAILY_WAGE = 3942.18;
const LOW_EXPERIENCE_THRESHOLD = 6; // місяців

const MATERNITY_DAYS_OPTIONS: { value: MaternityDays; label: string }[] = [
  { value: 126, label: '126 днів (стандарт)' },
  { value: 140, label: '140 днів (ускладнені пологи)' },
  { value: 180, label: '180 днів (багатоплідна вагітність)' },
];

export default function MaternityLeaveCalculatorModal({
  visible,
  onClose,
}: MaternityLeaveCalculatorModalProps) {
  // State для кроків
  const [step, setStep] = useState<Step>('input');

  // State для полів вводу
  const [income12Months, setIncome12Months] = useState<string>('');
  const [daysOfIncapacity, setDaysOfIncapacity] = useState<string>('0');
  const [maternityDays, setMaternityDays] = useState<MaternityDays>(126);
  const [experienceMonths, setExperienceMonths] = useState<string>('');

  // State для результату
  const [result, setResult] = useState<{
    averageDailyWage: number;
    totalAmount: number;
  } | null>(null);

  const resetState = () => {
    setStep('input');
    setIncome12Months('');
    setDaysOfIncapacity('0');
    setMaternityDays(126);
    setExperienceMonths('');
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const calculateMaternityLeave = () => {
    // Валідація обов'язкових полів
    const income = parseFloat(income12Months);
    const experience = parseInt(experienceMonths, 10);
    const incapacityDays = parseInt(daysOfIncapacity, 10) || 0;

    if (isNaN(income) || income <= 0) {
      alert('Будь ласка, введіть коректний дохід за 12 місяців');
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

    // 3. Розрахунок загальної суми
    const totalAmount = averageDailyWage * maternityDays;

    setResult({
      averageDailyWage: Math.round(averageDailyWage * 100) / 100,
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
        Враховуються лікарняні, відпустка за свій рахунок
      </Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="number-pad"
        value={daysOfIncapacity}
        onChangeText={setDaysOfIncapacity}
        placeholderTextColor={Colors.textMuted}
      />

      {/* Кількість днів декретної відпустки */}
      <Text style={styles.label}>
        Кількість днів відпустки у зв'язку з вагітністю та пологами{' '}
        <Text style={styles.required}>*</Text>
      </Text>
      {MATERNITY_DAYS_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.radioContainer}
          onPress={() => setMaternityDays(option.value)}
        >
          <View style={styles.radio}>
            {maternityDays === option.value && <View style={styles.radioSelected} />}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </TouchableOpacity>
      ))}

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

      {/* Кнопка розрахунку */}
      <TouchableOpacity style={styles.calculateButton} onPress={calculateMaternityLeave}>
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
            <Text style={styles.resultLabel}>Кількість днів відпустки:</Text>
            <Text style={styles.resultValue}>{maternityDays} днів</Text>
          </View>

          <View style={[styles.resultCard, styles.resultCardMain]}>
            <Text style={styles.resultLabel}>Сума декретних:</Text>
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
            <Text style={styles.title}>Калькулятор декретних</Text>
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
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: Fonts.sizes.base,
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

