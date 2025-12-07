import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface MilitaryTaxModalProps {
  visible: boolean;
  onClose: () => void;
}

type PayerType = 'employee' | 'fop_1_2_4' | 'fop_3_legal';

const MIN_SALARY = 8000;

export default function MilitaryTaxModal({ visible, onClose }: MilitaryTaxModalProps) {
  const [payerType, setPayerType] = useState<PayerType | null>(null);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculateTax = () => {
    const value = parseFloat(amount);
    let tax = 0;

    switch (payerType) {
      case 'employee':
        if (isNaN(value) || value < 0) {
          alert('Введіть коректну суму зарплати.');
          return;
        }
        tax = value * 0.05;
        break;
      case 'fop_1_2_4':
        tax = MIN_SALARY * 0.10;
        break;
      case 'fop_3_legal':
        if (isNaN(value) || value < 0) {
          alert('Введіть коректну суму доходу.');
          return;
        }
        tax = value * 0.01;
        break;
      default:
        alert('Будь ласка, оберіть тип платника.');
        return;
    }
    setResult(`Сума військового збору: ${tax.toFixed(2)} грн`);
  };
  
  const handleClose = () => {
    setPayerType(null);
    setAmount('');
    setResult(null);
    onClose();
  };

  const handlePayerTypeSelect = (type: PayerType) => {
    setPayerType(type);
    if (type === 'fop_1_2_4') {
      const tax = MIN_SALARY * 0.10;
      setResult(`Сума військового збору: ${tax.toFixed(2)} грн`);
    } else {
      setResult(null);
      setAmount('');
    }
  };

  const renderContent = () => {
    if (!payerType) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Оберіть тип платника</Text>
          
          <TouchableOpacity style={styles.optionButton} onPress={() => handlePayerTypeSelect('employee')}>
            <Text style={styles.optionButtonText}>Найманий працівник</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={() => handlePayerTypeSelect('fop_1_2_4')}>
            <Text style={styles.optionButtonText}>ФОП (1, 2, 4 група)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={() => handlePayerTypeSelect('fop_3_legal')}>
            <Text style={styles.optionButtonText}>ФОП (3 група) / Юр. особа</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const titleMap = {
      'employee': 'Для найманого працівника',
      'fop_1_2_4': 'Для ФОП (1, 2, 4 група)',
      'fop_3_legal': 'Для ФОП (3 група) / Юр. особи'
    };

    return (
      <View style={styles.formContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setPayerType(null)}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Змінити платника</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>{titleMap[payerType]}</Text>
        
        {payerType !== 'fop_1_2_4' && (
          <>
            <Text style={styles.label}>
              {payerType === 'employee' ? 'Заробітна плата' : 'Дохід'} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Введіть суму"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={styles.calculateButton} onPress={calculateTax}>
              <Text style={styles.calculateButtonText}>Розрахувати</Text>
            </TouchableOpacity>
          </>
        )}
        
        {result && (
          <View style={styles.resultContainer}>
            <MaterialIcons name="check-circle" size={32} color={Colors.success} />
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Військовий збір</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderContent()}
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
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    fontFamily: Fonts.heading,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButtonText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontFamily: Fonts.body,
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
