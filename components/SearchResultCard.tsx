// components/SearchResultCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

type Props = {
  title: string;
  link: string;
  site: string;
};

export const SearchResultCard = ({ title, link, site }: Props) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.site}>{site}</Text>
    <TouchableOpacity onPress={() => Linking.openURL(link)} style={styles.button}>
      <Text style={styles.buttonText}>Перейти</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  site: { color: '#666', fontSize: 13, marginBottom: 8 },
  button: {
    backgroundColor: '#002b6b',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
