// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import ConsultationModal from '../../components/ConsultationModal';
import { API_ENDPOINTS, getHeaders } from '../../constants/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAllCalendarEvents, CalendarEvent } from '../../utils/calendarService';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Theme';

interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  categories: string[];
  target_audience: string[];
  summary: string;
  published_at: string;
}

interface Report {
  date: string;
  type: string;
  title: string;
  who: string[];
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [upcomingReports, setUpcomingReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  // Для sticky кнопки
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showStickyButton, setShowStickyButton] = useState(false);
  const stickyButtonOpacity = useRef(new Animated.Value(0)).current;
  const stickyButtonTranslateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    fetchNews();
    fetchReports();
  }, []);

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const response = await fetch(`${API_ENDPOINTS.NEWS}?limit=3`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      setNews(data.items || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      
      // Загружаем все события календаря
      const allEvents = await fetchAllCalendarEvents();
      
      // Парсим даты и фильтруем будущие события
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureReports = allEvents
        .map(event => {
          // Парсим дату в формате DD.MM.YY или DD.MM.YYYY
          const parts = event.date.split('.');
          const day = parts[0];
          const month = parts[1];
          let year = parts[2];
          
          // Если год в формате YY, преобразуем в YYYY
          if (year.length === 2) {
            year = `20${year}`;
          }
          
          const eventDate = new Date(`${year}-${month}-${day}`);
          
          return {
            ...event,
            parsedDate: eventDate
          };
        })
        .filter(event => event.parsedDate >= today)
        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
        .slice(0, 3); // Берем первые 3
      
      setUpcomingReports(futureReports);
      console.log(`✅ Loaded ${futureReports.length} upcoming reports`);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const truncateTitle = (title: string, maxLength: number = 60) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    // Преобразуем DD.MM.YY в читаемый формат
    const parts = dateString.split('.');
    const day = parts[0];
    const month = parts[1];
    
    // Украинские названия месяцев
    const months = [
      'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];
    
    const monthName = months[parseInt(month) - 1];
    return `${day} ${monthName}`;
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const shouldShow = offsetY > 500;
        
        // Показываем sticky кнопки после прокрутки блока с кнопками (~500px)
        if (shouldShow !== showStickyButton) {
          setShowStickyButton(shouldShow);
          
          // Анимация появления/скрытия
          Animated.parallel([
            Animated.timing(stickyButtonOpacity, {
              toValue: shouldShow ? 1 : 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(stickyButtonTranslateY, {
              toValue: shouldShow ? 0 : -100,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }
  );

  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          <Image 
            source={require('../../assets/images/mainBanner.png')}
            style={styles.banner}
            resizeMode="cover"
          />
        </View>

      {/* What you can do section */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Що ви можете робити в eGlavBuh</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={Colors.primary} style={styles.checkIcon} />
            <Text style={styles.featureText}>подати звіти вчасно</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={Colors.primary} style={styles.checkIcon} />
            <Text style={styles.featureText}>читати актуальні новини</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={Colors.primary} style={styles.checkIcon} />
            <Text style={styles.featureText}>користуватись калькуляторами</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={Colors.primary} style={styles.checkIcon} />
            <Text style={styles.featureText}>знаходити відповіді на питання</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.consultationButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Консультація</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.buttonText}>Пошук</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.reportsBlock}>
          <Text style={styles.sectionTitle}>Найближчі звіти</Text>

          {loadingReports ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#282" />
              <Text style={styles.loadingText}>Завантаження звітів...</Text>
            </View>
          ) : upcomingReports.length > 0 ? (
            upcomingReports.map((report, index) => (
              <View 
                key={index} 
                style={[
                  styles.reportItem,
                  index < upcomingReports.length - 1 && styles.reportItemBorder
                ]}
              >
                <Text style={styles.title}>{report.title}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>До {formatDate(report.date)}</Text>
                  <Text style={styles.reportType}>{report.type}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Немає найближчих звітів</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Актуальні новини</Text>

        {loadingNews ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00bfa5" />
            <Text style={styles.loadingText}>Завантаження новин...</Text>
          </View>
        ) : news.length > 0 ? (
          news.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.newsCard}
              onPress={() => router.push({
                pathname: '/webview',
                params: { url: item.url, title: item.title }
              })}
            >
              <View style={styles.newsHeader}>
                <Text style={styles.newsSource}>{item.source}</Text>
                {item.categories && item.categories.length > 0 && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.categories[0]}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.newsTitle}>{truncateTitle(item.title, 60)}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Новин поки немає</Text>
          </View>
        )}

        {!loadingNews && news.length > 0 && (
          <TouchableOpacity 
            style={styles.allNewsButton}
            onPress={() => router.push('/news')}
          >
            <Text style={styles.allNewsButtonText}>Дивитись всі новини</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConsultationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
      </ScrollView>

      {/* Sticky Buttons (Consultation + Search) */}
      {showStickyButton && (
        <Animated.View 
          style={[
            styles.stickyButtonsContainer, 
            { 
              top: 0,
              opacity: stickyButtonOpacity,
              transform: [{ translateY: stickyButtonTranslateY }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.stickyConsultationButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.stickyButtonText}>Консультація</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.stickySearchButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.stickyButtonText}>Пошук</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  bannerContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  banner: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.xl,
  },
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  featuresTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'left',
  },
  featuresList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
  },
  checkIcon: {
    marginRight: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.white,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  consultationButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  searchButton: {
    backgroundColor: Colors.error,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  buttonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 17,
  },
  section: { 
    padding: Spacing.md 
  },
  sectionTitle: { 
    ...Typography.h4,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  reportsBlock: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },
  reportItem: {
    paddingVertical: Spacing.sm,
  },
  reportItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { 
    ...Typography.body,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { 
    ...Typography.caption,
    color: '#ff8a80',
  },
  reportType: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  newsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  newsSource: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: 11,
  },
  newsTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontSize: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  allNewsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  allNewsButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  stickyButtonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: Colors.background,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingHorizontal: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.sm as any,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  stickyConsultationButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '80%',
  },
  stickySearchButton: {
    backgroundColor: Colors.error,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '80%',
  },
  stickyButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 17,
  },
});