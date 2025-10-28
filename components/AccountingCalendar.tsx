import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';

interface Report {
  date: Date;
  type: string;
  title: string;
  who: string;
}

// Mock data fetching function. In a real app, you would fetch this from your data source.
// For now, I'm importing the JSON files directly.
import data_10_2025 from '../data/10_2025.json';
import data_11_2025 from '../data/11_2025.json';


const normalizeReportData = (data: any[]): Report[] => {
  return data.map((item) => {
    const parts = item.date.split('.');
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

    return {
      date,
      type: item.type || item.category,
      title: item.title || item.name,
      who: item.who,
    };
  });
};


export default function AccountingCalendar() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState('All');
  const [filterWho, setFilterWho] = useState('All');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showWhoModal, setShowWhoModal] = useState(false);
  const [tempFilterType, setTempFilterType] = useState('All');
  const [tempFilterWho, setTempFilterWho] = useState('All');

  useEffect(() => {
    const fetchAndProcessReports = () => {
      try {
        setError(null);
        const combinedData = [...data_10_2025, ...data_11_2025];
        const normalizedData = normalizeReportData(combinedData);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureReports = normalizedData
          .filter(report => report.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setReports(futureReports);
      } catch (err) {
        console.error("Failed to load or process reports:", err);
        setError('Помилка завантаження даних календаря. Спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessReports();
  }, []);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Завантаження...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }
  
  const filteredReports = reports.filter(report => {
    return (filterType === 'All' || report.type === filterType) &&
           (filterWho === 'All' || report.who === filterWho);
  });

  if (reports.length === 0) {
    return (
        <View style={styles.container}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Дані для цього місяця ще не оновлено</Text>
            </View>
        </View>
    )
  }
  
  const reportTypes = ['All', ...Array.from(new Set(reports.map(r => r.type)))];
  const reportWhos = ['All', ...Array.from(new Set(reports.map(r => r.who)))];

  const openTypeModal = () => {
    setTempFilterType(filterType);
    setShowTypeModal(true);
  };

  const openWhoModal = () => {
    setTempFilterWho(filterWho);
    setShowWhoModal(true);
  };

  const confirmTypeSelection = () => {
    setFilterType(tempFilterType);
    setShowTypeModal(false);
  };

  const confirmWhoSelection = () => {
    setFilterWho(tempFilterWho);
    setShowWhoModal(false);
  };

  // Group reports by month
  const groupedReports = filteredReports.reduce((acc, report) => {
    const month = report.date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(report);
    return acc;
    }, {} as Record<string, Report[]>);


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.filtersContainer}>
            <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Тип:</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={openTypeModal}>
                    <Text style={styles.pickerButtonText}>{filterType}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#00bfa5" />
                </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Хто подає:</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={openWhoModal}>
                    <Text style={styles.pickerButtonText}>{filterWho}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#00bfa5" />
                </TouchableOpacity>
            </View>
        </View>

        {/* Type Filter Modal */}
        <Modal
            visible={showTypeModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTypeModal(false)}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity 
                    style={styles.modalBackdrop} 
                    activeOpacity={1}
                    onPress={() => setShowTypeModal(false)}
                />
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                            <Text style={styles.modalCancelButton}>Скасувати</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Оберіть тип</Text>
                        <TouchableOpacity onPress={confirmTypeSelection}>
                            <Text style={styles.modalDoneButton}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                    <Picker
                        selectedValue={tempFilterType}
                        onValueChange={(itemValue) => setTempFilterType(itemValue)}
                        style={styles.modalPicker}
                        itemStyle={styles.pickerItem}
                    >
                        {reportTypes.map(type => <Picker.Item key={type} label={type} value={type} />)}
                    </Picker>
                </View>
            </View>
        </Modal>

        {/* Who Filter Modal */}
        <Modal
            visible={showWhoModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowWhoModal(false)}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity 
                    style={styles.modalBackdrop} 
                    activeOpacity={1}
                    onPress={() => setShowWhoModal(false)}
                />
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowWhoModal(false)}>
                            <Text style={styles.modalCancelButton}>Скасувати</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Хто подає</Text>
                        <TouchableOpacity onPress={confirmWhoSelection}>
                            <Text style={styles.modalDoneButton}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                    <Picker
                        selectedValue={tempFilterWho}
                        onValueChange={(itemValue) => setTempFilterWho(itemValue)}
                        style={styles.modalPicker}
                        itemStyle={styles.pickerItem}
                    >
                        {reportWhos.map(who => <Picker.Item key={who} label={who} value={who} />)}
                    </Picker>
                </View>
            </View>
        </Modal>
      {Object.entries(groupedReports).map(([month, monthReports]) => (
        <View key={month} style={styles.monthContainer}>
            <TouchableOpacity onPress={() => toggleMonth(month)}>
                <Text style={styles.monthHeader}>{month}</Text>
            </TouchableOpacity>
            {expandedMonths[month] && (
                <View>
                    {monthReports.map((report, index) => (
                        <View key={index} style={styles.reportCard}>
                            <Text style={styles.reportTitle}>{report.title}</Text>
                            <View style={styles.reportDetailRow}>
                                <Text style={styles.reportDetailLabel}>Дата:</Text>
                                <Text style={styles.reportDetailValue}>{report.date.toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.reportDetailRow}>
                                <Text style={styles.reportDetailLabel}>Тип:</Text>
                                <Text style={styles.reportDetailValue}>{report.type}</Text>
                            </View>
                             <View style={styles.reportDetailRow}>
                                <Text style={styles.reportDetailLabel}>Хто подає:</Text>
                                <Text style={styles.reportDetailValue}>{report.who}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d21'
  },
  contentContainer: {
    padding: 10,
    paddingBottom: 30,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    color: '#bdc3c7',
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 5,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#00bfa5',
    borderRadius: 10,
    backgroundColor: '#2c3e50',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 50,
  },
  pickerButtonText: {
    color: '#ecf0f1',
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d21',
  },
  modalTitle: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelButton: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  modalDoneButton: {
    color: '#00bfa5',
    fontSize: 16,
    fontWeight: '600',
  },
  modalPicker: {
    backgroundColor: '#2c3e50',
  },
  pickerItem: {
    color: '#fff', // For iOS picker wheel
    backgroundColor: '#2c3e50', // For iOS picker wheel
    fontSize: 18,
  },
  monthContainer: {
    marginBottom: 15,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#00bfa5',
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center'
  },
  reportCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10
  },
  reportDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  reportDetailLabel: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  reportDetailValue: {
    fontSize: 14,
    color: '#ecf0f1',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#ecf0f1',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: 16,
    textAlign: 'center',
  }
});
