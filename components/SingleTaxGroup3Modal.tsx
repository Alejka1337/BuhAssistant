import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SingleTaxGroup3ModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SingleTaxGroup3Modal({ visible, onClose }: SingleTaxGroup3ModalProps) {
  const [annualIncome, setAnnualIncome] = useState('');
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const calculateTax = () => {
    Keyboard.dismiss(); // Закрываем клавиатуру
    const income = parseFloat(annualIncome);
    if (isNaN(income) || income < 0) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректну суму доходу.');
      setResult(null);
      return;
    }

    const taxRate = isVatPayer ? 0.03 : 0.05;
    const monthlyIncome = income / 12;
    const monthlyTax = monthlyIncome * taxRate;

    const message = `Ставка: ${isVatPayer ? '3%' : '5%'}\nЄдиний податок (на місяць): ${monthlyTax.toFixed(2)} грн.`;
    setResult(message);
  };
  
  const handleClose = () => {
    setResult(null);
    setAnnualIncome('');
    setIsVatPayer(false);
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
          <Text style={styles.modalTitle}>Єдиний податок (3 група)</Text>

          <Text style={styles.label}>Дохід за рік, грн</Text>
          <TextInput
            style={styles.input}
            value={annualIncome}
            onChangeText={setAnnualIncome}
            keyboardType="numeric"
            placeholder="Введіть річний дохід"
            placeholderTextColor="#888"
          />

          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsVatPayer(!isVatPayer)}>
            <MaterialIcons 
              name={isVatPayer ? 'check-box' : 'check-box-outline-blank'}
              size={24} 
              color="#282" 
            />
            <Text style={styles.checkboxLabel}>Я платник ПДВ</Text>
          </TouchableOpacity>
          
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
        shadowOffset: { width: 0, height: 2 },
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
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 18,
        color: '#ecf0f1',
        textAlign: 'center',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      alignSelf: 'flex-start'
    },
    checkboxLabel: {
      marginLeft: 10,
      fontSize: 16,
      color: '#ecf0f1'
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
