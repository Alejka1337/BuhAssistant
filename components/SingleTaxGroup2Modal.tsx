import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

interface SingleTaxGroup2ModalProps {
  visible: boolean;
  onClose: () => void;
}

const MIN_SALARY = 8000;
const TAX_RATE = 0.20;
const MONTHLY_TAX = MIN_SALARY * TAX_RATE;

export default function SingleTaxGroup2Modal({ visible, onClose }: SingleTaxGroup2ModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Єдиний податок (2 група)</Text>

          <Text style={styles.descriptionText}>
            Ставка єдиного податку для 2-ї групи ФОП є фіксованою і становить 20% від мінімальної заробітної плати.
          </Text>

          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Сума податку на місяць:</Text>
            <Text style={styles.resultValue}>{MONTHLY_TAX.toFixed(2)} грн</Text>
          </View>
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
        backgroundColor: '#2c3e50',
        borderRadius: 20,
        padding: 35,
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
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ecf0f1',
    },
    descriptionText: {
        fontSize: 16,
        color: '#bdc3c7',
        textAlign: 'center',
        marginBottom: 25,
    },
    resultContainer: {
        padding: 20,
        backgroundColor: '#1a1d21',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#00bfa5',
        alignItems: 'center',
        width: '100%',
    },
    resultLabel: {
        fontSize: 16,
        color: '#bdc3c7',
        marginBottom: 8,
    },
    resultValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00bfa5',
    },
});
