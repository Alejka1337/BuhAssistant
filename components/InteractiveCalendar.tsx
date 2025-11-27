import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAllCalendarEvents, CalendarEvent } from '../utils/calendarService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/Theme';

// Настройка украинской локали для календаря
LocaleConfig.locales['uk'] = {
  monthNames: [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ],
  monthNamesShort: [
    'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
    'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'
  ],
  dayNames: [
    'Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'
  ],
  dayNamesShort: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сьогодні'
};
LocaleConfig.defaultLocale = 'uk';

interface Report {
  date: string; // YYYY-MM-DD format
  originalDate: Date;
  type: string;
  title: string;
  who: string[];
}

// Цвета для типов отчетностей
const TYPE_COLORS: Record<string, string> = {
  'Сплата': '#e74c3c',      // Красный
  'Статистика': '#3498db',  // Синий
  'ДПС': '#282',            // Зеленый
  'ДФС': '#f39c12',         // Желтый
};

const normalizeReportData = (data: CalendarEvent[]): Report[] => {
  return data.map((item) => {
    // Обработка формата даты: DD.MM.YY или DD.MM.YYYY
    const parts = item.date.split('.');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    
    // Если год в формате YY, преобразуем в YYYY
    if (year.length === 2) {
      year = `20${year}`;
    }
    
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
    const originalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return {
      date: dateStr,
      originalDate,
      type: item.type,
      title: item.title,
      who: item.who,
    };
  });
};

const formatDisplayDate = (date: Date): string => {
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export default function InteractiveCalendar() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>('');
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
        const allEvents = await fetchAllCalendarEvents();
        
        if (allEvents.length === 0) {
          setError('Немає доступних даних календаря');
          setReports([]);
          return;
        }
        
        const normalizedData = normalizeReportData(allEvents);
        setReports(normalizedData);
        
        // Устанавливаем текущий месяц
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setCurrentMonth(todayStr);
        
        console.log(`✅ Loaded ${normalizedData.length} events`);
        
      } catch (err) {
        console.error('❌ Failed to load calendar:', err);
        setError('Не вдалося завантажити календар. Перевірте підключення до інтернету.');
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, []);

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

  // Фильтрация отчетностей
  const filteredReports = reports.filter(report => {
    const typeMatch = filterType === 'Всі' || report.type === filterType;
    const whoMatch = filterWho === 'Всі' || report.who.includes(filterWho);
    return typeMatch && whoMatch;
  });

  // Получаем уникальные типы и категории "Хто подає"
  const reportTypes = ['Всі', ...Array.from(new Set(reports.map(r => r.type)))];
  const allWhoCategories = reports.flatMap(r => r.who);
  const reportWhos = ['Всі', ...Array.from(new Set(allWhoCategories))];

  // Группировка отчетностей по датам
  const reportsByDate: Record<string, Report[]> = {};
  filteredReports.forEach(report => {
    if (!reportsByDate[report.date]) {
      reportsByDate[report.date] = [];
    }
    reportsByDate[report.date].push(report);
  });

  // Создание markedDates для календаря
  const markedDates: any = {};
  Object.keys(reportsByDate).forEach(date => {
    const reportsOnDate = reportsByDate[date];
    const uniqueTypes = Array.from(new Set(reportsOnDate.map(r => r.type)));
    const dots = uniqueTypes.map(type => ({
      color: TYPE_COLORS[type] || Colors.primary
    }));

    markedDates[date] = {
      dots: dots,
      selected: date === selectedDate,
      selectedColor: Colors.primary,
    };
  });

  // Если есть выбранная дата, но на нее нет точек, добавляем выделение
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: Colors.primary,
    };
  }

  // Отчетности выбранного дня
  const selectedDayReports = selectedDate ? (reportsByDate[selectedDate] || []) : [];

  const onDayPress = (day: any) => {
    // Если нажали на уже выбранный день - снимаем выделение
    if (selectedDate === day.dateString) {
      setSelectedDate('');
    } else {
      setSelectedDate(day.dateString);
    }
  };

  const onMonthChange = (month: any) => {
    setCurrentMonth(month.dateString);
  };

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

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + 16 }
      ]}
    >
      {/* Фильтры */}
      <View style={styles.filtersContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Тип:</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={openTypeModal}>
            <Text style={styles.pickerButtonText}>{filterType}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Хто подає:</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={openWhoModal}>
            <Text style={styles.pickerButtonText}>{filterWho}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Календарь */}
      <View style={styles.calendarContainer}>
        <Calendar
          current={currentMonth}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
          markingType={'multi-dot'}
          markedDates={markedDates}
          hideExtraDays={true}
          firstDay={1}
          theme={{
            calendarBackground: Colors.cardBackground,
            textSectionTitleColor: Colors.textSecondary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.white,
            todayTextColor: Colors.primaryDark,
            todayBackgroundColor: Colors.background,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.disabled,
            monthTextColor: Colors.textPrimary,
            arrowColor: Colors.primary,
            textDayFontFamily: 'Inter',
            textMonthFontFamily: 'Unbounded',
            textDayHeaderFontFamily: 'Inter',
            textDayFontSize: 15,
            textMonthFontSize: 17,
            textDayHeaderFontSize: 13,
          }}
          style={styles.calendar}
          renderArrow={(direction) => (
            <MaterialIcons 
              name={direction === 'left' ? 'chevron-left' : 'chevron-right'} 
              size={28} 
              color={Colors.primary} 
            />
          )}
        />
      </View>

      {/* Список отчетностей выбранного дня */}
      {selectedDate && (
        <View style={styles.selectedDayContainer}>
          <Text style={styles.selectedDayTitle}>
            {selectedDayReports.length > 0 
              ? `Звітність на ${formatDisplayDate(new Date(selectedDate))}`
              : `Немає звітності на ${formatDisplayDate(new Date(selectedDate))}`
            }
          </Text>
          
          {selectedDayReports.map((report, index) => (
            <View key={index} style={styles.reportCard}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <View style={styles.reportDetailRow}>
                <Text style={styles.reportDetailLabel}>Тип:</Text>
                <View style={styles.typeTag}>
                  <Text style={[styles.typeTagText, { color: TYPE_COLORS[report.type] || Colors.primary }]}>
                    {report.type}
                  </Text>
                </View>
              </View>
              <View style={styles.reportDetailRow}>
                <Text style={styles.reportDetailLabel}>Хто подає:</Text>
                <View style={styles.whoTagsContainer}>
                  {report.who.map((who, idx) => (
                    <View key={idx} style={styles.whoTag}>
                      <Text style={styles.whoTagText}>{who}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 5,
    marginLeft: 5,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 50,
  },
  pickerButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  calendarContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  calendar: {
    borderRadius: BorderRadius.lg,
  },
  selectedDayContainer: {
    marginTop: Spacing.sm,
  },
  selectedDayTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reportTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reportDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  reportDetailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  reportDetailValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  reportTypeValue: {
    ...Typography.captionBold,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  typeTag: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  typeTagText: {
    ...Typography.captionBold,
    fontSize: 12,
    fontWeight: '600',
  },
  whoTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    
  },
  whoTag: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  whoTagText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  modalCancelButton: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
  },
  modalDoneButton: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalPicker: {
    backgroundColor: Colors.cardBackground,
  },
  pickerItem: {
    color: Colors.white,
    backgroundColor: Colors.cardBackground,
    fontSize: 18,
  },
});

