import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState('All');
  const [filterWho, setFilterWho] = useState('All');

  useEffect(() => {
    const fetchAndProcessReports = () => {
      try {
        const combinedData = [...data_10_2025, ...data_11_2025];
        const normalizedData = normalizeReportData(combinedData);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureReports = normalizedData
          .filter(report => report.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setReports(futureReports);
      } catch (error) {
        console.error("Failed to load or process reports:", error);
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
        <Text>Loading...</Text>
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
            <Text>Дані для цього місяця ще не оновлено</Text>
        </View>
    )
  }
  
  const reportTypes = ['All', ...Array.from(new Set(reports.map(r => r.type)))];
  const reportWhos = ['All', ...Array.from(new Set(reports.map(r => r.who)))];

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
    <ScrollView style={styles.container}>
        <View style={styles.filtersContainer}>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={filterType}
                    onValueChange={(itemValue) => setFilterType(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                    itemStyle={styles.pickerItem}
                >
                    {reportTypes.map(type => <Picker.Item key={type} label={type} value={type} />)}
                </Picker>
            </View>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={filterWho}
                    onValueChange={(itemValue) => setFilterWho(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                    itemStyle={styles.pickerItem}
                >
                    {reportWhos.map(who => <Picker.Item key={who} label={who} value={who} />)}
                </Picker>
            </View>
        </View>
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
    padding: 10,
    backgroundColor: '#1a1d21'
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00bfa5',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#2c3e50'
  },
  picker: {
    color: '#fff',
    height: 50, // Better touch area
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
  }
});
