import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';

interface PdfoCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

const TAX_RATE = 0.18; // 18%

export default function PdfoCalculatorModal({ visible, onClose }: PdfoCalculatorModalProps) {
  const [salary, setSalary] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculatePdfo = () => {
    Keyboard.dismiss(); // Закрываем клавиатуру
    const salaryValue = parseFloat(salary);
    if (isNaN(salaryValue) || salaryValue < 0) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректну суму зарплати.');
      setResult(null);
      return;
    }
    const pdfo = salaryValue * TAX_RATE;
    setResult(`Сума ПДФО: ${pdfo.toFixed(2)} грн`);
  };
  
  const handleClose = () => {
    setResult(null);
    setSalary('');
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
          <Text style={styles.modalTitle}>Калькулятор ПДФО</Text>

          <Text style={styles.label}>Сума заробітної плати</Text>
          <TextInput
            style={styles.input}
            value={salary}
            onChangeText={setSalary}
            keyboardType="numeric"
            placeholder="Введіть суму"
            placeholderTextColor="#888"
          />
          
          <TouchableOpacity style={styles.calculateButton} onPress={calculatePdfo}>
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ecf0f1',
    },
});
