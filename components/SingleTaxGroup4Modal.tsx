/**
 * Калькулятор Єдиного податку для 4 групи
 * Розрахунок податку на земельні ділянки
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
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';
import {
  ngoTable,
  landTypeLabels,
  landTypesWithNGO,
  LandType,
  DEFAULT_COEFFICIENT,
  INDEXATION_COEFFICIENT_2025,
} from '../data/ngoData';

interface SingleTaxGroup4ModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'question' | 'input' | 'result';

export default function SingleTaxGroup4Modal({ visible, onClose }: SingleTaxGroup4ModalProps) {
  // State для навигации
  const [step, setStep] = useState<Step>('question');
  const [hasNGO, setHasNGO] = useState<boolean | null>(null);

  // State для случая БЕЗ НГО
  const [selectedRegion, setSelectedRegion] = useState<string>(ngoTable[0].region);
  const [selectedLandType, setSelectedLandType] = useState<LandType>('rillya');
  const [hectares, setHectares] = useState<string>('');
  const [months, setMonths] = useState<string>('12');

  // State для случая С НГО
  const [ngoValue, setNgoValue] = useState<string>('');
  const [hectaresWithNGO, setHectaresWithNGO] = useState<string>('');
  const [selectedLandTypeWithNGO, setSelectedLandTypeWithNGO] = useState<number>(0);

  // Результат
  const [yearlyTax, setYearlyTax] = useState<number>(0);
  const [monthlyTax, setMonthlyTax] = useState<number>(0);

  const resetState = () => {
    setStep('question');
    setHasNGO(null);
    setSelectedRegion(ngoTable[0].region);
    setSelectedLandType('rillya');
    setHectares('');
    setMonths('12');
    setNgoValue('');
    setHectaresWithNGO('');
    setSelectedLandTypeWithNGO(0);
    setYearlyTax(0);
    setMonthlyTax(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleQuestionAnswer = (answer: boolean) => {
    setHasNGO(answer);
    setStep('input');
  };

  const calculateWithoutNGO = () => {
    // Формула: МПО = НГО x S(га) x K x (M/12)
    const regionData = ngoTable.find((r) => r.region === selectedRegion);
    if (!regionData) return;

    const ngoFromTable = regionData[selectedLandType];
    const S = parseFloat(hectares);
    const K = DEFAULT_COEFFICIENT;
    const M = parseInt(months, 10);

    if (isNaN(S) || isNaN(M) || M < 1 || M > 12) {
      alert('Будь ласка, введіть коректні значення');
      return;
    }

    const MPO = ngoFromTable * S * K * (M / 12);
    const yearlyAmount = Math.ceil(MPO * 100) / 100; // Округлення до 2 знаків після коми в більшу сторону
    const monthlyAmount = Math.ceil((yearlyAmount / 12) * 100) / 100;

    setYearlyTax(yearlyAmount);
    setMonthlyTax(monthlyAmount);
    setStep('result');
  };

  const calculateWithNGO = () => {
    // Формула: Сумма = НГО x S(га) x СН x КИ
    const NGO = parseFloat(ngoValue);
    const S = parseFloat(hectaresWithNGO);
    const SN = landTypesWithNGO[selectedLandTypeWithNGO].rate / 100; // Ставка в десятичному вигляді
    const KI = INDEXATION_COEFFICIENT_2025;

    if (isNaN(NGO) || isNaN(S)) {
      alert('Будь ласка, введіть коректні значення');
      return;
    }

    const totalTax = NGO * S * SN * KI;
    const yearlyAmount = Math.ceil(totalTax * 100) / 100; // Округлення до 2 знаків після коми в більшу сторону
    const monthlyAmount = Math.ceil((yearlyAmount / 12) * 100) / 100;

    setYearlyTax(yearlyAmount);
    setMonthlyTax(monthlyAmount);
    setStep('result');
  };

  const handleCalculate = () => {
    if (hasNGO) {
      calculateWithNGO();
    } else {
      calculateWithoutNGO();
    }
  };

  const handleBack = () => {
    if (step === 'input') {
      setStep('question');
      setHasNGO(null);
    } else if (step === 'result') {
      setStep('input');
    }
  };

  const renderQuestionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.questionTitle}>
        Чи проводилась Нормативно Грошова Оцінка для вашої земельної ділянки?
      </Text>
      <Text style={styles.questionHint}>
        НГО - це оцінка вартості земельної ділянки згідно з кадастровою документацією
      </Text>

      <TouchableOpacity style={styles.optionButton} onPress={() => handleQuestionAnswer(true)}>
        <Text style={styles.optionButtonText}>Так, проводилась</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton} onPress={() => handleQuestionAnswer(false)}>
        <Text style={styles.optionButtonText}>Ні, не проводилась</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInputStepWithoutNGO = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Введіть дані про вашу земельну ділянку</Text>

      {/* Область */}
      <Text style={styles.label}>Область де розташована земельна ділянка</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedRegion}
          onValueChange={(value) => setSelectedRegion(value)}
          style={styles.picker}
        >
          {ngoTable.map((region) => (
            <Picker.Item 
              key={region.region} 
              label={region.region} 
              value={region.region}
              color={Platform.OS === 'web' ? Colors.textPrimary : undefined}
            />
          ))}
        </Picker>
      </View>

      {/* Тип ділянки */}
      <Text style={styles.label}>Тип ділянки</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLandType}
          onValueChange={(value) => setSelectedLandType(value as LandType)}
          style={styles.picker}
        >
          {Object.entries(landTypeLabels).map(([key, label]) => (
            <Picker.Item 
              key={key} 
              label={label} 
              value={key}
              color={Platform.OS === 'web' ? Colors.textPrimary : undefined}
            />
          ))}
        </Picker>
      </View>

      {/* Кількість гектарів */}
      <Text style={styles.label}>Кількість гектарів землі</Text>
      <TextInput
        style={styles.input}
        placeholder="Наприклад: 30 або 30.5"
        keyboardType="decimal-pad"
        value={hectares}
        onChangeText={setHectares}
      />

      {/* Кількість місяців */}
      <Text style={styles.label}>
        Кількість місяців в рік коли ви володієте земельною ділянкою
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Від 1 до 12"
        keyboardType="number-pad"
        value={months}
        onChangeText={(text) => {
          const num = parseInt(text, 10);
          if (text === '' || (num >= 1 && num <= 12)) {
            setMonths(text);
          }
        }}
        maxLength={2}
      />

      <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
        <Text style={styles.calculateButtonText}>Розрахувати</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInputStepWithNGO = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Введіть дані згідно вашої кадастрової документації</Text>

      {/* НГО */}
      <Text style={styles.label}>НГО згідно вашої кадастрової документації</Text>
      <TextInput
        style={styles.input}
        placeholder="Наприклад: 25601.54"
        keyboardType="decimal-pad"
        value={ngoValue}
        onChangeText={setNgoValue}
      />

      {/* Кількість гектарів */}
      <Text style={styles.label}>Кількість гектарів землі</Text>
      <TextInput
        style={styles.input}
        placeholder="Наприклад: 30 або 30.5"
        keyboardType="decimal-pad"
        value={hectaresWithNGO}
        onChangeText={setHectaresWithNGO}
      />

      {/* Тип ділянки зі ставкою */}
      <Text style={styles.label}>Тип вашої ділянки</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLandTypeWithNGO}
          onValueChange={(value) => setSelectedLandTypeWithNGO(value)}
          style={styles.picker}
        >
          {landTypesWithNGO.map((type, index) => (
            <Picker.Item
              key={index}
              label={type.label}
              value={index}
              color={Platform.OS === 'web' ? Colors.textPrimary : undefined}
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
        <Text style={styles.calculateButtonText}>Розрахувати</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResultStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.resultHeader}>
        <MaterialIcons name="check-circle" size={48} color={Colors.success} />
        <Text style={styles.resultTitle}>Розрахунок завершено</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Сума Єдиного податку на рік:</Text>
        <Text style={styles.resultValue}>
          {yearlyTax.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн
        </Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Сума Єдиного податку на місяць:</Text>
        <Text style={styles.resultValue}>
          {monthlyTax.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн
        </Text>
      </View>

      <Text style={styles.resultNote}>
        ℹ️ Це орієнтовний розрахунок. Для точних даних зверніться до податкової служби.
      </Text>

      <TouchableOpacity style={styles.resetButton} onPress={resetState}>
        <MaterialIcons name="refresh" size={20} color={Colors.primary} />
        <Text style={styles.resetButtonText}>Новий розрахунок</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            {step !== 'question' && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Єдиний податок 4 група</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'question' && renderQuestionStep()}
            {step === 'input' && hasNGO === false && renderInputStepWithoutNGO()}
            {step === 'input' && hasNGO === true && renderInputStepWithNGO()}
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
  stepContainer: {
    padding: Spacing.lg,
  },
  
  // Question Step
  questionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.heading,
  },
  questionHint: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: Fonts.body,
  },
  optionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontWeight: Fonts.weights.bold as any,
    textAlign: 'center',
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.body,
  },

  // Input Step
  stepTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    fontFamily: Fonts.heading,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    fontFamily: Fonts.body,
  },
  pickerContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: Colors.textPrimary,
    ...Platform.select({
      web: {
        fontSize: Fonts.sizes.base,
        fontFamily: Fonts.body,
        backgroundColor: Colors.background,
        paddingLeft: 8,
        outline: 'none',
      },
    }),
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

  // Result Step
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
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  resultLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.body,
  },
  resultValue: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
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

