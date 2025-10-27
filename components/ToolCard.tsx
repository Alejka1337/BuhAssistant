// components/ToolCard.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export const ToolCard = ({ title, icon = 'calculator-outline', onPress }: Props) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={28} color="#002b6b" />
    </View>
    <Text style={styles.title}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    backgroundColor: '#e6eaf5',
    borderRadius: 40,
    padding: 10,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#002b6b',
  },
});
