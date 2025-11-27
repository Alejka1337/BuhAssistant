import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';

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
    Keyboard.dismiss(); // Закрываем клавиатуру
    const value = parseFloat(amount);
    let tax = 0;

    switch (payerType) {
      case 'employee':
        if (isNaN(value) || value < 0) {
          Alert.alert('Помилка', 'Введіть коректну суму зарплати.'); return;
        }
        tax = value * 0.05;
        break;
      case 'fop_1_2_4':
        tax = MIN_SALARY * 0.10;
        break;
      case 'fop_3_legal':
        if (isNaN(value) || value < 0) {
          Alert.alert('Помилка', 'Введіть коректну суму доходу.'); return;
        }
        tax = value * 0.01;
        break;
      default:
        Alert.alert('Помилка', 'Будь ласка, оберіть тип платника.'); return;
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
        <>
          <Text style={styles.modalTitle}>Оберіть тип платника</Text>
          <TouchableOpacity style={styles.optionButton} onPress={() => handlePayerTypeSelect('employee')}>
            <Text style={styles.buttonText}>Найманий працівник</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handlePayerTypeSelect('fop_1_2_4')}>
            <Text style={styles.buttonText}>ФОП (1, 2, 4 група)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handlePayerTypeSelect('fop_3_legal')}>
            <Text style={styles.buttonText}>ФОП (3 група) / Юр. особа</Text>
          </TouchableOpacity>
        </>
      );
    }

    const titleMap = {
      'employee': 'Для найманого працівника',
      'fop_1_2_4': 'Для ФОП (1, 2, 4 група)',
      'fop_3_legal': 'Для ФОП (3 група) / Юр. особи'
    };

    return (
      <>
        <TouchableOpacity style={styles.backButton} onPress={() => setPayerType(null)}>
          <Text style={styles.backButtonText}>← Змінити платника</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{titleMap[payerType]}</Text>
        {payerType !== 'fop_1_2_4' && (
          <>
            <Text style={styles.label}>{payerType === 'employee' ? 'Заробітна плата' : 'Дохід'}</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Введіть суму"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.calculateButton} onPress={calculateTax}>
              <Text style={styles.buttonText}>Розрахувати</Text>
            </TouchableOpacity>
          </>
        )}
        {result && <Text style={styles.resultText}>{result}</Text>}
      </>
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    modalView: { width: '90%', backgroundColor: '#22262c', borderRadius: 20, padding: 25, paddingTop: 50, alignItems: 'center' },
    closeButton: { position: 'absolute', top: 10, right: 15 },
    closeButtonText: { fontSize: 30, color: '#ecf0f1' },
    modalTitle: { marginBottom: 20, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#ecf0f1' },
    optionButton: { backgroundColor: '#282', borderRadius: 8, paddingVertical: 15, width: '100%', marginBottom: 10 },
    calculateButton: { backgroundColor: '#282', borderRadius: 8, paddingVertical: 12, width: '100%', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    label: { alignSelf: 'flex-start', marginLeft: 5, marginBottom: 5, color: '#bdc3c7', fontSize: 14 },
    input: { width: '100%', backgroundColor: '#1a1d21', borderWidth: 1, borderColor: '#282', padding: 12, marginBottom: 10, borderRadius: 8, fontSize: 18, color: '#ecf0f1', textAlign: 'center' },
    resultText: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#ecf0f1', textAlign: 'center' },
    backButton: { position: 'absolute', top: 15, left: 15 },
    backButtonText: { fontSize: 16, color: '#282' },
});
