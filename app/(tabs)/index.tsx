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
      <View style={styles.header}>
        <Text style={styles.headerText}>Головна</Text>
      </View>

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
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { backgroundColor: '#002b6b', padding: 16 },
  headerText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  consultationButton: {
    backgroundColor: '#28a745',
  },
  searchButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  title: { fontSize: 14, fontWeight: '500' },
  date: { color: '#555' },
});