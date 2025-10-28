import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';

interface NetSalaryModalProps {
  visible: boolean;
  onClose: () => void;
}

const PDFO_RATE = 0.18; // 18%
const MILITARY_TAX_RATE = 0.05; // 5%

export default function NetSalaryModal({ visible, onClose }: NetSalaryModalProps) {
  const [grossSalary, setGrossSalary] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculateNetSalary = () => {
    const salary = parseFloat(grossSalary);
    if (isNaN(salary) || salary < 0) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректну суму зарплати.');
      setResult(null);
      return;
    }
    const pdfo = salary * PDFO_RATE;
    const militaryTax = salary * MILITARY_TAX_RATE;
    const netSalary = salary - (pdfo + militaryTax);

    const resultMessage = `ПДФО: ${pdfo.toFixed(2)} грн\nВійськовий збір: ${militaryTax.toFixed(2)} грн\n\nЧиста зарплата: ${netSalary.toFixed(2)} грн`;
    setResult(resultMessage);
  };
  
  const handleClose = () => {
    setResult(null);
    setGrossSalary('');
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
          <Text style={styles.modalTitle}>Калькулятор чистої зарплати</Text>

          <Text style={styles.label}>Заробітна плата (до вирахування податків)</Text>
          <TextInput
            style={styles.input}
            value={grossSalary}
            onChangeText={setGrossSalary}
            keyboardType="numeric"
            placeholder="Введіть суму"
            placeholderTextColor="#888"
          />
          
          <TouchableOpacity style={styles.calculateButton} onPress={calculateNetSalary}>
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
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    modalView: { width: '90%', backgroundColor: '#2c3e50', borderRadius: 20, padding: 25, alignItems: 'center' },
    closeButton: { position: 'absolute', top: 10, right: 15 },
    closeButtonText: { fontSize: 30, color: '#ecf0f1' },
    modalTitle: { marginBottom: 20, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#ecf0f1' },
    label: { alignSelf: 'flex-start', marginLeft: 5, marginBottom: 5, color: '#bdc3c7', fontSize: 14 },
    input: { width: '100%', backgroundColor: '#1a1d21', borderWidth: 1, borderColor: '#00bfa5', padding: 12, marginBottom: 20, borderRadius: 8, fontSize: 18, color: '#ecf0f1', textAlign: 'center' },
    calculateButton: { backgroundColor: '#00bfa5', borderRadius: 8, paddingVertical: 12, width: '100%' },
    buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    resultText: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: '#ecf0f1', textAlign: 'center', lineHeight: 24 },
});
