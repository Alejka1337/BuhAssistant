// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { reports } from '../../constants/reports';
import { useRouter } from 'expo-router';
import ConsultationModal from '../../components/ConsultationModal';


export default function CalendarScreen() {
  const router = useRouter();
  const upcomingReports = reports.slice(0, 3);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.consultationButton]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Консультація</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.searchButton]}>
          <Text style={styles.buttonText}>Пошук</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Найближчі звіти</Text>

        {upcomingReports.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.title}>{r.title}</Text>
            <Text style={styles.date}>До {r.dueDate}</Text>
          </View>
        ))}
      </View>

      <ConsultationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1d21' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  consultationButton: {
    backgroundColor: '#00bfa5',
  },
  searchButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  section: { padding: 16 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 15,
    color: '#ecf0f1',
  },
  card: {
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  title: { 
    fontSize: 15, 
    fontWeight: '500',
    color: '#ecf0f1',
    marginBottom: 5,
  },
  date: { 
    color: '#7f8c8d',
    fontSize: 13,
  },
});