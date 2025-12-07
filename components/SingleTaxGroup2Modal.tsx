import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';

interface SingleTaxGroup2ModalProps {
  visible: boolean;
  onClose: () => void;
}

const MIN_SALARY = 8000;
const TAX_RATE = 0.20;
const MONTHLY_TAX = MIN_SALARY * TAX_RATE;

export default function SingleTaxGroup2Modal({ visible, onClose }: SingleTaxGroup2ModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Єдиний податок 2 група</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <Text style={styles.descriptionText}>
                Ставка єдиного податку для 2-ї групи ФОП є фіксованою і становить 20% від мінімальної заробітної плати.
              </Text>

              <View style={styles.resultContainer}>
                <MaterialIcons name="check-circle" size={48} color={Colors.success} />
                <Text style={styles.resultTitle}>Розрахунок податку</Text>
                
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Сума податку на місяць:</Text>
                  <Text style={styles.resultValue}>{MONTHLY_TAX.toFixed(2)} грн</Text>
                </View>
              </View>
            </View>
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
  descriptionText: {
    fontSize: Fonts.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: Fonts.body,
    lineHeight: 24,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  resultTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    fontFamily: Fonts.heading,
  },
  resultCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.body,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    textAlign: 'center',
  },
});
