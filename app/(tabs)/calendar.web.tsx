// app/(tabs)/calendar.web.tsx - WEB VERSION
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAllCalendarEvents, CalendarEvent } from '../../utils/calendarService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { useResponsive } from '../../utils/responsive';
import Select from '../../components/web/Select';
import HoverCard from '../../components/web/HoverCard';

// Inject CSS for web - only on client side
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .react-native-calendars .day-names {
      border-bottom: 2px solid ${Colors.primary} !important;
      padding-bottom: 8px !important;
      margin-bottom: 4px !important;
    }
    .hover-card-container:hover .report-title-text {
      color: ${Colors.primary} !important;
      transition: color 0.2s ease;
    }
  `;
  document.head.appendChild(style);
}

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

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [filterType, setFilterType] = useState('Всі');
  const [filterWho, setFilterWho] = useState('Всі');

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

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + 16 }
      ]}
    >
      {/* Заголовок для Desktop */}
      {isDesktop && (
        <Text style={[styles.pageTitle, styles.pageTitleDesktop]}>Календар</Text>
      )}

      {/* Фильтры */}
      <View style={[styles.filtersContainer, isDesktop && styles.filtersContainerDesktop]}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Тип:</Text>
          <Select
            value={filterType}
            onValueChange={(value: string | null) => setFilterType(value || 'Всі')}
            items={reportTypes.map(type => ({ label: type, value: type }))}
            style={styles.selectStyle}
          />
        </View>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Хто подає:</Text>
          <Select
            value={filterWho}
            onValueChange={(value: string | null) => setFilterWho(value || 'Всі')}
            items={reportWhos.map(who => ({ label: who, value: who }))}
            style={styles.selectStyle}
          />
        </View>
      </View>

      {/* Календарь */}
      <View style={[styles.calendarContainer, isDesktop && styles.calendarContainerDesktop]}>
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
        <View style={[styles.selectedDayContainer, isDesktop && styles.selectedDayContainerDesktop]}>
          <Text style={styles.selectedDayTitle}>
            {selectedDayReports.length > 0 
              ? `Звітність на ${formatDisplayDate(new Date(selectedDate))}`
              : `Немає звітності на ${formatDisplayDate(new Date(selectedDate))}`
            }
          </Text>
          
          {selectedDayReports.map((report, index) => (
            <HoverCard
              key={index}
              style={[styles.reportCard, ...(isDesktop ? [styles.reportCardDesktop] : [])]}
              hoverStyle={styles.reportCardHover}
            >
              <Text 
                style={styles.reportTitle}
                // @ts-ignore - className работает только на веб
                className="report-title-text"
              >
                {report.title}
              </Text>
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
            </HoverCard>
          ))}
        </View>
      )}
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
  pageTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  pageTitleDesktop: {
    marginLeft: 64,
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
  filtersContainerDesktop: {
    marginHorizontal: Spacing.xl * 2,
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
  selectStyle: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 50,
    fontSize: 16,
    paddingRight: 40,
  },
  calendarContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  calendarContainerDesktop: {
    marginHorizontal: Spacing.xl * 2,
  },
  calendar: {
    borderRadius: BorderRadius.lg,
  },
  selectedDayContainer: {
    marginTop: Spacing.sm,
  },
  selectedDayContainerDesktop: {
    maxWidth: 800,
    marginHorizontal: 'auto' as any,
    width: '100%',
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
    minHeight: 120,
  },
  reportCardDesktop: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center' as any,
  },
  reportCardHover: {
    backgroundColor: '#1e2126',
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
});

