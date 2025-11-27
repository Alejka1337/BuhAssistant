// components/SearchResultCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

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
        <View style={styles.siteTag}>
          <Text style={styles.site}>{site}</Text>
        </View>
        <TouchableOpacity onPress={handleOpen} style={styles.button}>
          <Text style={styles.buttonText}>Відкрити</Text>
          <MaterialIcons name="arrow-forward" size={16} color={Colors.white} style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    ...Typography.bodyBold,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  siteTag: {
    backgroundColor: 'rgba(210, 225, 214, 0.13)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    shadowColor: Colors.textMuted,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    marginRight: Spacing.sm,
  },
  site: { 
    ...Typography.caption,
    color: Colors.info, 
    fontWeight: '700',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: { 
    ...Typography.caption,
    color: Colors.white, 
    fontWeight: '600',
    marginRight: 4,
  },
  buttonIcon: {
    marginLeft: 2,
  },
});
