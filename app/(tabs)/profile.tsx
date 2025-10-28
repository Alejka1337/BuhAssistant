import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={60} color="#00bfa5" />
          </View>
          <Text style={styles.userName}>Користувач</Text>
          <Text style={styles.userEmail}>guest@example.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Налаштування</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="business" size={24} color="#00bfa5" />
            <Text style={styles.menuItemText}>Тип користувача</Text>
            <MaterialIcons name="chevron-right" size={24} color="#7f8c8d" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="notifications" size={24} color="#00bfa5" />
            <Text style={styles.menuItemText}>Сповіщення</Text>
            <MaterialIcons name="chevron-right" size={24} color="#7f8c8d" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="info" size={24} color="#00bfa5" />
            <Text style={styles.menuItemText}>Про додаток</Text>
            <MaterialIcons name="chevron-right" size={24} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Повний функціонал профілю у розробці
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
  profileSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#2c3e50',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1d21',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  userName: {
    color: '#ecf0f1',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  menuItemText: {
    flex: 1,
    color: '#ecf0f1',
    fontSize: 16,
    marginLeft: 15,
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

