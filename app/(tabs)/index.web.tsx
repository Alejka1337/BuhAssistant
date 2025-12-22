// app/(tabs)/index.web.tsx - WEB VERSION
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import ConsultationModal from '../../components/ConsultationModal.web';
import { API_ENDPOINTS, getHeaders } from '../../constants/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAllCalendarEvents, CalendarEvent } from '../../utils/calendarService';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import HoverCard from '../../components/web/HoverCard';
import { useSEO } from '../../hooks/useSEO';
import { PAGE_METAS } from '../../utils/seo';

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
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [upcomingReports, setUpcomingReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // SEO мета-теги
  useSEO(PAGE_METAS.home);

  useEffect(() => {
    fetchNews();
    fetchReports();
  }, [isDesktop]); // Перезагружаем при изменении режима Desktop/Mobile

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      // Для Desktop загружаем 6 новостей, для Mobile - 3
      const limit = isDesktop ? 6 : 3;
      const response = await fetch(`${API_ENDPOINTS.NEWS}?limit=${limit}`, {
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

  const handleNewsPress = (item: NewsItem) => {
    window.open(item.url, '_blank');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
    >
      {/* Desktop Content Wrapper */}
      <View style={isDesktop && styles.desktopContentWrapper}>
        {/* Banner Image */}
        <View style={[styles.bannerContainer, isDesktop && styles.bannerContainerDesktop]}>
          <Image 
            source={require('../../assets/images/banner_web.png')}
            style={[styles.banner, isDesktop && styles.bannerDesktop]}
            resizeMode="cover"
          />
        </View>

        {/* What you can do section */}
        <View style={styles.featuresSection}>
        <Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>Що ви можете робити в eGlavBuh</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={colors.primary} style={styles.checkIcon} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>подати звіти вчасно</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={colors.primary} style={styles.checkIcon} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>читати актуальні новини</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={colors.primary} style={styles.checkIcon} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>користуватись калькуляторами</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={24} color={colors.primary} style={styles.checkIcon} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>знаходити відповіді на питання</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, isDesktop && styles.buttonContainerDesktop]}>
        <TouchableOpacity 
          style={[styles.consultationButton, { backgroundColor: colors.primary }, isDesktop && styles.buttonDesktop]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Консультація</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.error }, isDesktop && styles.buttonDesktop]}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.buttonText}>Пошук</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={[styles.reportsBlock, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Найближчі звіти</Text>

          {loadingReports ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Завантаження звітів...</Text>
            </View>
          ) : upcomingReports.length > 0 ? (
            upcomingReports.map((report, index) => (
              <View
                key={index}
                style={[
                  styles.reportItem,
                  index < upcomingReports.length - 1 && { ...styles.reportItemBorder, borderBottomColor: colors.background }
                ]}
              >
                <Text style={[styles.title, { color: colors.textPrimary }]}>{report.title}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>До {formatDate(report.date)}</Text>
                  <Text style={[styles.reportType, { color: colors.primary, backgroundColor: colors.background }]}>{report.type}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Немає найближчих звітів</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Актуальні новини</Text>

        {loadingNews ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Завантаження новин...</Text>
          </View>
        ) : news.length > 0 ? (
          <View style={isDesktop ? styles.newsGridDesktop : undefined}>
            {news.map((item) => (
              <HoverCard
                key={item.id} 
                style={[styles.newsCard, { backgroundColor: colors.cardBackground }, ...(isDesktop ? [styles.newsCardDesktop] : [])]}
                hoverStyle={styles.newsCardHover}
                onPress={() => handleNewsPress(item)}
              >
                <View style={styles.newsHeader}>
                  <Text style={[styles.newsSource, { color: colors.primary }]}>{item.source}</Text>
                  {item.categories && item.categories.length > 0 && (
                    <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.categoryText, { color: colors.textPrimary }]}>{item.categories[0]}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.newsTitle, { color: colors.textPrimary }]}>{truncateTitle(item.title, 60)}</Text>
              </HoverCard>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Новин поки немає</Text>
          </View>
        )}

        {!loadingNews && news.length > 0 && (
          <TouchableOpacity 
            style={[styles.allNewsButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/news')}
          >
            <Text style={styles.allNewsButtonText}>Дивитись всі новини</Text>
          </TouchableOpacity>
        )}
      </View>

      </View>
      {/* End Desktop Content Wrapper */}

      <ConsultationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  desktopContentWrapper: {
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    width: '100%',
    paddingHorizontal: 64,
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
    maxHeight: 250,
  },
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  featuresTitle: {
    ...Typography.h3,
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
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  buttonContainerDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  buttonDesktop: {
    width: 300,
    alignSelf: 'auto',
  },
  consultationButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  searchButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  buttonText: {
    ...Typography.body,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
  },
  section: { 
    padding: Spacing.md 
  },
  sectionTitle: { 
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  reportsBlock: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },
  reportItem: {
    paddingVertical: Spacing.sm,
  },
  reportItemBorder: {
    borderBottomWidth: 1,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { 
    ...Typography.body,
    fontWeight: '500',
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
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  newsCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  newsGridDesktop: {
    display: 'grid' as any,
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: Spacing.md,
  },
  newsCardDesktop: {
    marginBottom: 0,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  newsSource: {
    ...Typography.caption,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '500',
    fontSize: 11,
  },
  newsTitle: {
    ...Typography.body,
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
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    ...Typography.caption,
  },
  allNewsButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  allNewsButtonText: {
    ...Typography.body,
    color: '#ffffff',
    fontWeight: '600',
  },
  // Web Desktop стили
  bannerContainerDesktop: {
    maxWidth: '100%',
    width: '100%',
    marginHorizontal: 'auto' as any,
  },
  bannerDesktop: {
    maxHeight: 420,
    // height: 'calc(60vh - 100px)' as any,
    aspectRatio: undefined,
  },
  newsCardHover: {
    transform: [{ translateY: -4 }],
    ...Shadows.large,
  },
});