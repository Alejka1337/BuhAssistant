import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

interface SelectProps {
  value: any;
  onValueChange: (value: any) => void;
  items: Array<{ label: string; value: any }>;
  style?: any;
  placeholder?: string;
}

/**
 * Универсальный компонент выбора
 * - Web: использует нативный <select>
 * - Native: использует @react-native-picker/picker
 */
export default function Select({ value, onValueChange, items, style, placeholder }: SelectProps) {
  if (Platform.OS === 'web') {
    // Для Web используем нативный select
    return (
      <select
        value={value || ''}
        onChange={(e) => {
          const selectedValue = e.target.value;
          // Пытаемся преобразовать обратно в правильный тип
          const item = items.find(i => String(i.value) === selectedValue);
          onValueChange(item ? item.value : selectedValue);
        }}
        style={{
          ...webSelectStyles,
          ...(style || {}),
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {items.map((item) => (
          <option key={String(item.value)} value={String(item.value)}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }

  // Для Native используем Picker
  return (
    <View style={[styles.pickerContainer, style]}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
        itemStyle={styles.pickerItem}
      >
        {placeholder && <Picker.Item label={placeholder} value={null} />}
        {items.map((item) => (
          <Picker.Item key={String(item.value)} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
}

// Web стили для select
const webSelectStyles = {
  backgroundColor: Colors.cardBackground,
  color: Colors.textPrimary,
  border: `2px solid ${Colors.primary}`,
  borderRadius: BorderRadius.md,
  padding: `${Spacing.sm}px ${Spacing.md}px`,
  fontSize: 16,
  fontFamily: Typography.body.fontFamily,
  cursor: 'pointer',
  outline: 'none',
  width: '100%',
  minHeight: 44,
  appearance: 'none' as any,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23282' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  backgroundSize: '24px',
  paddingRight: '40px',
};

// Native стили для Picker
const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    height: 150,
    justifyContent: 'center',
  },
  picker: {
    color: Colors.textPrimary,
    height: 150,
  },
  pickerItem: {
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
});

