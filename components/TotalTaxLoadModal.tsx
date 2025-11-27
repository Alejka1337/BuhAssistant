import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TotalTaxLoadModalProps {
  visible: boolean;
  onClose: () => void;
}

type FopGroup = 'group1' | 'group2' | 'group3';

const ESV = 1760;
const MILITARY_TAX_FIXED = 800;
const EP_GROUP1 = 302.8;
const EP_GROUP2 = 1600;

export default function TotalTaxLoadModal({ visible, onClose }: TotalTaxLoadModalProps) {
  const [fopGroup, setFopGroup] = useState<FopGroup | null>(null);
  const [annualIncome, setAnnualIncome] = useState('');
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs when fopGroup changes
    if (fopGroup === 'group1' || fopGroup === 'group2') {
      calculateTax();
    }
  }, [fopGroup]);

  const calculateTax = () => {
    Keyboard.dismiss(); // Закрываем клавиатуру
    let ep = 0, vz = 0, total = 0;
    const income = parseFloat(annualIncome);

    switch (fopGroup) {
      case 'group1':
        ep = EP_GROUP1;
        vz = MILITARY_TAX_FIXED;
        total = ep + ESV + vz;
        setResult(`ЄП: ${ep.toFixed(2)}\nЄСВ: ${ESV.toFixed(2)}\nВЗ: ${vz.toFixed(2)}\n\nЗагалом: ${total.toFixed(2)} грн/міс`);
        break;
      case 'group2':
        ep = EP_GROUP2;
        vz = MILITARY_TAX_FIXED;
        total = ep + ESV + vz;
        setResult(`ЄП: ${ep.toFixed(2)}\nЄСВ: ${ESV.toFixed(2)}\nВЗ: ${vz.toFixed(2)}\n\nЗагалом: ${total.toFixed(2)} грн/міс`);
        break;
      case 'group3':
        if (isNaN(income) || income < 0) {
          Alert.alert('Помилка', 'Введіть коректну суму доходу.'); return;
        }
        const epRate = isVatPayer ? 0.03 : 0.05;
        ep = (income / 12) * epRate;
        vz = (income / 12) * 0.01;
        total = ep + ESV + vz;
        setResult(`ЄП (${isVatPayer ? '3%' : '5%'}): ${ep.toFixed(2)}\nЄСВ: ${ESV.toFixed(2)}\nВЗ (1%): ${vz.toFixed(2)}\n\nЗагалом: ${total.toFixed(2)} грн/міс`);
        break;
    }
  };
  
  const handleClose = () => {
    setFopGroup(null);
    setAnnualIncome('');
    setIsVatPayer(false);
    setResult(null);
    onClose();
  };

  const handleGroupSelect = (group: FopGroup) => {
    setFopGroup(group);
    setResult(null); 
    setAnnualIncome('');
  };

  const renderContent = () => {
    if (!fopGroup) {
      return (
        <>
          <Text style={styles.modalTitle}>Оберіть групу ФОП</Text>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleGroupSelect('group1')}>
            <Text style={styles.buttonText}>1 група</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleGroupSelect('group2')}>
            <Text style={styles.buttonText}>2 група</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleGroupSelect('group3')}>
            <Text style={styles.buttonText}>3 група</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <TouchableOpacity style={styles.backButton} onPress={() => setFopGroup(null)}>
          <Text style={styles.backButtonText}>← Змінити групу</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{`Податковий тягар (група ${fopGroup.slice(-1)})`}</Text>
        {fopGroup === 'group3' && (
          <>
            <Text style={styles.label}>Річний дохід, грн</Text>
            <TextInput style={styles.input} value={annualIncome} onChangeText={setAnnualIncome} keyboardType="numeric" placeholderTextColor="#888" />
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsVatPayer(!isVatPayer)}>
              <MaterialIcons name={isVatPayer ? 'check-box' : 'check-box-outline-blank'} size={24} color="#282" />
              <Text style={styles.checkboxLabel}>Я платник ПДВ</Text>
            </TouchableOpacity>
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
        <View style={styles.modalView}><TouchableOpacity style={styles.closeButton} onPress={handleClose}><Text style={styles.closeButtonText}>×</Text></TouchableOpacity>{renderContent()}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    modalView: { width: '90%', backgroundColor: '#22262c', borderRadius: 20, padding: 25, paddingTop: 50, alignItems: 'center' },
    closeButton: { position: 'absolute', top: 10, right: 15, zIndex: 1 },
    closeButtonText: { fontSize: 30, color: '#ecf0f1' },
    modalTitle: { marginBottom: 20, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#ecf0f1' },
    optionButton: { backgroundColor: '#282', borderRadius: 8, paddingVertical: 15, width: '100%', marginBottom: 10 },
    calculateButton: { backgroundColor: '#282', borderRadius: 8, paddingVertical: 12, width: '100%', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    label: { alignSelf: 'flex-start', color: '#bdc3c7', fontSize: 14, marginLeft: 5, marginBottom: 5 },
    input: { width: '100%', backgroundColor: '#1a1d21', borderWidth: 1, borderColor: '#282', padding: 12, borderRadius: 8, fontSize: 18, color: '#ecf0f1', textAlign: 'center' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, alignSelf: 'flex-start' },
    checkboxLabel: { marginLeft: 10, fontSize: 16, color: '#ecf0f1' },
    resultText: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: '#ecf0f1', textAlign: 'center', lineHeight: 26 },
    backButton: { position: 'absolute', top: 15, left: 15 },
    backButtonText: { fontSize: 16, color: '#282' },
});
