import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ForumScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Форум у розробці
          </Text>
          <Text style={styles.placeholderSubtext}>
            Скоро тут з'явиться можливість спілкування з іншими користувачами
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d21',
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  placeholderText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
  },
});

