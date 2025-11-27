import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Report {
  date: Date;
  type: string;
  title: string;
  who: string[]; // Теперь массив категорий
}

// Calendar data is now fetched from the backend API
import { fetchAllCalendarEvents, CalendarEvent } from '../utils/calendarService';


const normalizeReportData = (data: CalendarEvent[]): Report[] => {
  return data.map((item) => {
    // Обработка формата даты: DD.MM.YY или DD.MM.YYYY
    const parts = item.date.split('.');
    const day = parts[0];
    const month = parts[1];
    let year = parts[2];
    
    // Если год в формате YY, преобразуем в YYYY
    if (year.length === 2) {
      year = `20${year}`; // Предполагаем 20XX
    }
    
    const date = new Date(`${year}-${month}-${day}`);

    return {
      date,
      type: item.type,
      title: item.title,
      who: item.who, // Уже массив
    };
  });
};

// Функция для форматирования даты
const formatDate = (date: Date): string => {
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

// Функция для получения названия месяца и года
const getMonthYearLabel = (date: Date): string => {
  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};


export default function AccountingCalendar() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState('Всі');
  const [filterWho, setFilterWho] = useState('Всі');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showWhoModal, setShowWhoModal] = useState(false);
  const [tempFilterType, setTempFilterType] = useState('Всі');
  const [tempFilterWho, setTempFilterWho] = useState('Всі');

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📅 Loading all calendar events...');
        
        // Загружаем все события из all.json
        const allEvents = await fetchAllCalendarEvents();
        
        if (allEvents.length === 0) {
          setError('Немає доступних даних календаря');
          setReports([]);
          return;
        }
        
        // Нормализуем данные
        const normalizedData = normalizeReportData(allEvents);
        
        // Фильтруем только будущие события (дата которых еще не прошла)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureReports = normalizedData
          .filter(report => report.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setReports(futureReports);
        console.log(`✅ Loaded ${futureReports.length} future events (from ${allEvents.length} total)`);
        
        // Автоматически раскрываем первый месяц
        if (futureReports.length > 0) {
          const firstMonthLabel = getMonthYearLabel(futureReports[0].date);
          setExpandedMonths({ [firstMonthLabel]: true });
        }
        
      } catch (err) {
        console.error('❌ Failed to load calendar:', err);
        setError('Не вдалося завантажити календар. Перевірте підключення до інтернету.');
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
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
    const typeMatch = filterType === 'Всі' || report.type === filterType;
    // who теперь массив - проверяем, включает ли он выбранную категорию
    const whoMatch = filterWho === 'Всі' || report.who.includes(filterWho);
    return typeMatch && whoMatch;
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
  
  // Получаем уникальные типы
  const reportTypes = ['Всі', ...Array.from(new Set(reports.map(r => r.type)))];
  
  // Для who нужно развернуть массивы и получить уникальные значения
  const allWhoCategories = reports.flatMap(r => r.who);
  const reportWhos = ['Всі', ...Array.from(new Set(allWhoCategories))];

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

  // Group reports by month (with Ukrainian month names)
  const groupedReports = filteredReports.reduce((acc, report) => {
    const month = getMonthYearLabel(report.date);
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(report);
    return acc;
    }, {} as Record<string, Report[]>);


  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + 16 }
      ]}
    >
        <View style={styles.filtersContainer}>
            <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Тип:</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={openTypeModal}>
                    <Text style={styles.pickerButtonText}>{filterType}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#282" />
                </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Хто подає:</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={openWhoModal}>
                    <Text style={styles.pickerButtonText}>{filterWho}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#282" />
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
                                <Text style={styles.reportDateValue}>{formatDate(report.date)}</Text>
                            </View>
                            <View style={styles.reportDetailRow}>
                                <Text style={styles.reportDetailLabel}>Тип:</Text>
                                <Text style={styles.reportTypeValue}>{report.type}</Text>
                            </View>
                             <View style={styles.reportDetailRow}>
                                <Text style={styles.reportDetailLabel}>Хто подає:</Text>
                                <Text style={styles.reportDetailValue}>{report.who.join(', ')}</Text>
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
    borderColor: '#282',
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
    color: '#282',
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
    backgroundColor: '#282',
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
  reportDateValue: {
    fontSize: 14,
    color: '#ff8a80',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right'
  },
  reportTypeValue: {
    fontSize: 14,
    color: '#282',
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
