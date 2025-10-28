// components/SearchResultCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Props = {
  title: string;
  description: string;
  url: string;
  site: string;
};

export const SearchResultCard = ({ title, description, url, site }: Props) => {
  const handleOpen = () => {
    router.push({
      pathname: '/webview',
      params: {
        url: url,
        title: title,
      },
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.description} numberOfLines={3}>{description}</Text>
      <View style={styles.footer}>
        <Text style={styles.site}>{site}</Text>
        <TouchableOpacity onPress={handleOpen} style={styles.button}>
          <Text style={styles.buttonText}>Відкрити</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#fff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00bfa5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 10,
    color: '#ecf0f1',
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#bdc3c7',
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  site: { 
    color: '#00bfa5', 
    fontSize: 12, 
    fontWeight: '600',
    flex: 1,
  },
  button: {
    backgroundColor: '#00bfa5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 13,
    marginRight: 4,
  },
  buttonIcon: {
    marginLeft: 2,
  },
});
