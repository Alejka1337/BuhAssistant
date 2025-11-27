import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';

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
    Keyboard.dismiss(); // Закрываем клавиатуру
    const income = parseFloat(annualIncome);
    if (isNaN(income) || income < 0) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректну суму доходу.');
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
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Єдиний податок (1 група)</Text>

          <Text style={styles.label}>Дохід за рік, грн</Text>
          <TextInput
            style={styles.input}
            value={annualIncome}
            onChangeText={setAnnualIncome}
            keyboardType="numeric"
            placeholder="Наприклад: 1200000"
            placeholderTextColor="#888"
          />
          
          <TouchableOpacity style={styles.calculateButton} onPress={calculateTax}>
            <Text style={styles.buttonText}>Розрахувати</Text>
          </TouchableOpacity>

          {result && (
            <Text style={styles.resultText}>{result}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalView: {
        width: '90%',
        backgroundColor: '#22262c',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 15,
    },
    closeButtonText: {
        fontSize: 30,
        color: '#ecf0f1',
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ecf0f1',
    },
    label: {
        alignSelf: 'flex-start',
        marginLeft: 5,
        marginBottom: 5,
        color: '#bdc3c7',
        fontSize: 14,
    },
    input: {
        width: '100%',
        backgroundColor: '#1a1d21',
        borderWidth: 1,
        borderColor: '#282',
        padding: 12,
        marginBottom: 20,
        borderRadius: 8,
        fontSize: 18,
        color: '#ecf0f1',
        textAlign: 'center',
    },
    calculateButton: {
        backgroundColor: '#282',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 30,
        elevation: 2,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    resultText: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ecf0f1',
        textAlign: 'center',
    },
});
