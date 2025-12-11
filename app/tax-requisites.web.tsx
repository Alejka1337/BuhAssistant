import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import PageWrapper from '@/components/web/PageWrapper';
import MobileMenu, { MobileMenuWrapper } from '@/components/web/MobileMenu';
import Select from '@/components/web/Select';
import { 
  getRegionsWithDistricts,
  getRequisites, 
  getTaxTypeName,
  TaxRequisite,
  TaxRequisiteType 
} from '@/utils/taxRequisiteService';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useResponsive } from '@/utils/responsive';

export default function TaxRequisitesWebScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop, isMobile } = useResponsive();
  const [regionsWithDistricts, setRegionsWithDistricts] = useState<Record<string, string[]>>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [requisites, setRequisites] = useState<TaxRequisite[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;

  // Завантажити структуру регіонів при монтуванні
  useEffect(() => {
    loadRegionsWithDistricts();
  }, []);

  // Скинути вибір міста при зміні регіону
  useEffect(() => {
    setSelectedDistrict('');
  }, [selectedRegion]);

  const loadRegionsWithDistricts = async () => {
    try {
      const data = await getRegionsWithDistricts();
      setRegionsWithDistricts(data);
    } catch (error) {
      console.error('Error loading regions with districts:', error);
    }
  };

  const handleSearch = async () => {
    if (!selectedRegion) {
      Alert.alert('Помилка', 'Оберіть область');
      return;
    }
    if (!selectedDistrict) {
      Alert.alert('Помилка', 'Оберіть територіальну громаду для пошуку');
      return;
    }

    setLoading(true);
    setCurrentPage(1);
    
    try {
      const type = selectedType ? (selectedType as TaxRequisiteType) : undefined;
      const response = await getRequisites(selectedDistrict, selectedRegion, type, ITEMS_PER_PAGE, 0);
      setRequisites(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading requisites:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити реквізити');
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async (page: number) => {
    setLoading(true);
    
    try {
      const type = selectedType ? (selectedType as TaxRequisiteType) : undefined;
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await getRequisites(selectedDistrict, selectedRegion, type, ITEMS_PER_PAGE, offset);
      setRequisites(response.items);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading page:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити сторінку');
    } finally {
      setLoading(false);
    }
  };

  const copyIban = async (iban: string) => {
    try {
      await Clipboard.setStringAsync(iban);
      setCopiedIban(iban);
      setTimeout(() => setCopiedIban(null), 2000);
    } catch (error) {
      console.error('Error copying IBAN:', error);
    }
  };

  const renderContent = () => (
    <View style={[styles.content, isDesktop && styles.desktopContent]}>
      {/* Заголовок только для десктопа */}
      {isDesktop && (
        <>
          <Text style={styles.pageTitle}>Реквізити для сплати податків</Text>
          <Text style={styles.subtitle}>
            Знайдіть реквізити для сплати податків та зборів по вашому регіону
          </Text>
        </>
      )}

      {/* Фільтри */}
      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Область *</Text>
            <Select
              value={selectedRegion}
              items={regionItems}
              onValueChange={setSelectedRegion}
              placeholder="Оберіть область"
            />
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Територіальна Громада *</Text>
            <Select
              value={selectedDistrict}
              items={districtItems}
              onValueChange={setSelectedDistrict}
              placeholder="Спочатку оберіть область"
            />
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Тип податку/збору</Text>
            <Select
              value={selectedType}
              items={typeItems}
              onValueChange={setSelectedType}
              placeholder="Всі типи"
            />
          </View>

          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading || !selectedRegion || !selectedDistrict}
          >
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Знайти</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Результати */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Завантаження...</Text>
        </View>
      ) : requisites.length > 0 ? (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              Знайдено: {total} {total === 1 ? 'реквізит' : total < 5 ? 'реквізити' : 'реквізитів'}
            </Text>
          </View>

          <View style={styles.tableContainer}>
            <table style={tableStyles.table}>
              <thead>
                <tr style={tableStyles.headerRow}>
                  <th style={tableStyles.headerCell}>Тип</th>
                  <th style={tableStyles.headerCell}>Отримувач</th>
                  <th style={tableStyles.headerCell}>Код ЄДРПОУ</th>
                  <th style={tableStyles.headerCell}>Банк</th>
                  <th style={tableStyles.headerCell}>IBAN</th>
                </tr>
              </thead>
              <tbody>
                {requisites.map((req) => (
                  <tr key={req.id} style={tableStyles.row}>
                    <td style={tableStyles.cell}>
                      <Text style={tableStyles.typeText}>
                        {getTaxTypeName(req.type)}
                      </Text>
                    </td>
                    <td style={tableStyles.cell}>
                      <Text style={tableStyles.recipientText}>
                        {req.recipient_name}
                      </Text>
                    </td>
                    <td style={tableStyles.cell}>
                      <Text style={tableStyles.codeText}>{req.recipient_code}</Text>
                    </td>
                    <td style={tableStyles.cell}>
                      <Text style={tableStyles.bankText}>{req.bank_name}</Text>
                    </td>
                    <td style={tableStyles.cell}>
                      <View style={styles.ibanContainer}>
                        <Text style={tableStyles.ibanText}>{req.iban}</Text>
                        <TouchableOpacity
                          style={[
                            styles.copyButton,
                            copiedIban === req.iban && styles.copyButtonSuccess
                          ]}
                          onPress={() => copyIban(req.iban)}
                        >
                          <MaterialIcons 
                            name={copiedIban === req.iban ? "check" : "content-copy"} 
                            size={16} 
                            color={copiedIban === req.iban ? "#228822" : "#666"} 
                          />
                        </TouchableOpacity>
                      </View>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </View>

          {/* Пагінація */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => loadPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? Colors.textMuted : Colors.primary} />
              </TouchableOpacity>

              <Text style={styles.paginationText}>
                Сторінка {currentPage} з {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => loadPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? Colors.textMuted : Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : selectedRegion && selectedDistrict ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyStateText}>
            Не знайдено реквізитів для обраної територіальної громади та типу
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="location-on" size={64} color={Colors.primary} />
          <Text style={styles.emptyStateText}>
            Оберіть область та територіальну громаду для пошуку реквізитів
          </Text>
        </View>
      )}
    </View>
  );

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const regionItems = Object.keys(regionsWithDistricts).map(r => ({ label: r, value: r }));
  const districtItems = selectedRegion 
    ? (regionsWithDistricts[selectedRegion] || []).map(d => ({ label: d, value: d }))
    : [];
  const typeItems = [
    { label: 'Всі типи', value: '' },
    { label: 'ЄСВ за працівників', value: TaxRequisiteType.ESV_EMPLOYEES },
    { label: 'ЄСВ ФОП 2/3 група', value: TaxRequisiteType.ESV_FOP },
    { label: 'ПДФО за працівників', value: TaxRequisiteType.PDFO_EMPLOYEES },
    { label: 'Військовий збір за працівників', value: TaxRequisiteType.MILITARY_EMPLOYEES },
    { label: 'Військовий збір ФОП 2 група', value: TaxRequisiteType.MILITARY_FOP },
    { label: 'Єдиний податок ФОП 2 група', value: TaxRequisiteType.SINGLE_TAX_FOP },
  ];

  // Для Mobile Web - добавляем бургер-меню
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <MobileMenu title="Реквізити для сплати податків" />
        <MobileMenuWrapper>
          <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
              {renderContent()}
            </ScrollView>
          </View>
        </MobileMenuWrapper>
      </View>
    );
  }

  // Для Desktop Web - используем PageWrapper
  return (
    <PageWrapper showMobileNav={false}>
      <Stack.Screen 
        options={{ 
          title: 'Реквізити для сплати податків - eGlavBuh',
          headerShown: false,
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {renderContent()}
        </ScrollView>
      </View>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  desktopContent: {
    maxWidth: 1440,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
    width: '100%',
  },
  pageTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  filters: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterItem: {
    flex: 1,
    minWidth: 200,
  },
  filterLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minWidth: 120,
  },
  searchButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsCount: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tableContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  ibanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  copyButton: {
    padding: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  copyButtonSuccess: {
    backgroundColor: '#2d5a2d',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  paginationButtonDisabled: {
    borderColor: Colors.textMuted,
    opacity: 0.5,
  },
  paginationText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  headerRow: {
    backgroundColor: Colors.background,
    borderBottom: `2px solid ${Colors.primary}`,
  },
  headerCell: {
    padding: '16px',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  row: {
    borderBottom: '1px solid #3a3d41',
    transition: 'background-color 0.2s',
  },
  cell: {
    padding: '16px',
    verticalAlign: 'top' as const,
  },
  typeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  recipientText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  districtText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  codeText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  bankText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ibanText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontWeight: '500' as const,
  },
};

