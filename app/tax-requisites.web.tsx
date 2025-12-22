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
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/utils/responsive';
import { useSEO } from '@/hooks/useSEO';
import { PAGE_METAS } from '@/utils/seo';

export default function TaxRequisitesWebScreen() {
  useSEO(PAGE_METAS.taxRequisites);
  const insets = useSafeAreaInsets();
  const { isDesktop, isMobile } = useResponsive();
  const { colors } = useTheme();
  const [regionsWithDistricts, setRegionsWithDistricts] = useState<Record<string, string[]>>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [requisites, setRequisites] = useState<TaxRequisite[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
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

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Dynamic table styles based on theme
  const getTableStyles = () => ({
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    headerRow: {
      backgroundColor: colors.background,
      borderBottom: `2px solid ${colors.primary}`,
    },
    headerCell: {
      padding: '16px',
      textAlign: 'left' as const,
      fontSize: '14px',
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    row: {
      borderBottom: `1px solid ${colors.borderColor}`,
      transition: 'background-color 0.2s',
    },
    cell: {
      padding: '16px',
      verticalAlign: 'top' as const,
    },
    typeText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600' as const,
    },
    recipientText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    districtText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    codeText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    bankText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    ibanText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: 'monospace',
      fontWeight: '500' as const,
    },
  });

  const dynamicTableStyles = getTableStyles();

  const renderContent = () => (
    <View style={[styles.content, isDesktop && styles.desktopContent]}>
      {/* Заголовок только для десктопа */}
      {isDesktop && (
        <>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Реквізити для сплати податків</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Знайдіть реквізити для сплати податків та зборів по вашому регіону
          </Text>
        </>
      )}

      {/* Фільтри */}
      <View style={[styles.filters, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Область *</Text>
            <Select
              value={selectedRegion}
              items={regionItems}
              onValueChange={setSelectedRegion}
              placeholder="Оберіть область"
            />
          </View>

          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Територіальна Громада *</Text>
            <Select
              value={selectedDistrict}
              items={districtItems}
              onValueChange={setSelectedDistrict}
              placeholder="Спочатку оберіть область"
            />
          </View>

          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Тип податку/збору</Text>
            <Select
              value={selectedType}
              items={typeItems}
              onValueChange={setSelectedType}
              placeholder="Всі типи"
            />
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
            disabled={loading || !selectedRegion || !selectedDistrict}
          >
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={[styles.searchButtonText, { color: colors.white }]}>Знайти</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Результати */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Завантаження...</Text>
        </View>
      ) : requisites.length > 0 ? (
        <>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              Знайдено: {total} {total === 1 ? 'реквізит' : total < 5 ? 'реквізити' : 'реквізитів'}
            </Text>
          </View>

          <View style={[styles.tableContainer, { backgroundColor: colors.cardBackground }]}>
            <table style={dynamicTableStyles.table}>
              <thead>
                <tr style={dynamicTableStyles.headerRow}>
                  <th style={dynamicTableStyles.headerCell}>Тип</th>
                  <th style={dynamicTableStyles.headerCell}>Отримувач</th>
                  <th style={dynamicTableStyles.headerCell}>Код ЄДРПОУ</th>
                  <th style={dynamicTableStyles.headerCell}>Банк</th>
                  <th style={dynamicTableStyles.headerCell}>IBAN</th>
                </tr>
              </thead>
              <tbody>
                {requisites.map((req) => {
                  const recipientId = `recipient-${req.id}`;
                  const codeId = `code-${req.id}`;
                  const bankId = `bank-${req.id}`;
                  const ibanId = `iban-${req.id}`;
                  
                  return (
                    <tr key={req.id} style={dynamicTableStyles.row}>
                      <td style={dynamicTableStyles.cell}>
                        <Text style={dynamicTableStyles.typeText}>
                          {getTaxTypeName(req.type)}
                        </Text>
                      </td>
                      <td style={dynamicTableStyles.cell}>
                        <View style={styles.fieldWithCopy}>
                          <Text style={dynamicTableStyles.recipientText}>
                            {req.recipient_name}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.copyButton,
                              { backgroundColor: colors.background },
                              copiedField === recipientId && styles.copyButtonSuccess
                            ]}
                            onPress={() => copyToClipboard(req.recipient_name, recipientId)}
                          >
                            <MaterialIcons 
                              name={copiedField === recipientId ? "check" : "content-copy"} 
                              size={16} 
                              color={copiedField === recipientId ? colors.primary : colors.textMuted} 
                            />
                          </TouchableOpacity>
                        </View>
                      </td>
                      <td style={dynamicTableStyles.cell}>
                        <View style={styles.fieldWithCopy}>
                          <Text style={dynamicTableStyles.codeText}>{req.recipient_code}</Text>
                          <TouchableOpacity
                            style={[
                              styles.copyButton,
                              { backgroundColor: colors.background },
                              copiedField === codeId && styles.copyButtonSuccess
                            ]}
                            onPress={() => copyToClipboard(req.recipient_code, codeId)}
                          >
                            <MaterialIcons 
                              name={copiedField === codeId ? "check" : "content-copy"} 
                              size={16} 
                              color={copiedField === codeId ? colors.primary : colors.textMuted} 
                            />
                          </TouchableOpacity>
                        </View>
                      </td>
                      <td style={dynamicTableStyles.cell}>
                        <View style={styles.fieldWithCopy}>
                          <Text style={dynamicTableStyles.bankText}>{req.bank_name}</Text>
                          <TouchableOpacity
                            style={[
                              styles.copyButton,
                              { backgroundColor: colors.background },
                              copiedField === bankId && styles.copyButtonSuccess
                            ]}
                            onPress={() => copyToClipboard(req.bank_name, bankId)}
                          >
                            <MaterialIcons 
                              name={copiedField === bankId ? "check" : "content-copy"} 
                              size={16} 
                              color={copiedField === bankId ? colors.primary : colors.textMuted} 
                            />
                          </TouchableOpacity>
                        </View>
                      </td>
                      <td style={dynamicTableStyles.cell}>
                        <View style={styles.fieldWithCopy}>
                          <Text style={dynamicTableStyles.ibanText}>{req.iban}</Text>
                          <TouchableOpacity
                            style={[
                              styles.copyButton,
                              { backgroundColor: colors.background },
                              copiedField === ibanId && styles.copyButtonSuccess
                            ]}
                            onPress={() => copyToClipboard(req.iban, ibanId)}
                          >
                            <MaterialIcons 
                              name={copiedField === ibanId ? "check" : "content-copy"} 
                              size={16} 
                              color={copiedField === ibanId ? colors.primary : colors.textMuted} 
                            />
                          </TouchableOpacity>
                        </View>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </View>

          {/* Пагінація */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.paginationButton, { backgroundColor: colors.cardBackground, borderColor: colors.primary }, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => loadPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? colors.textMuted : colors.primary} />
              </TouchableOpacity>

              <Text style={[styles.paginationText, { color: colors.textPrimary }]}>
                Сторінка {currentPage} з {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButton, { backgroundColor: colors.cardBackground, borderColor: colors.primary }, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => loadPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? colors.textMuted : colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : selectedRegion && selectedDistrict ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
            Не знайдено реквізитів для обраної територіальної громади та типу
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="location-on" size={64} color={colors.primary} />
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
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
          <View style={[styles.container, { backgroundColor: colors.background }]}>
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
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  filters: {
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
    marginBottom: Spacing.xs,
  },
  searchButton: {
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
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsCount: {
    ...Typography.body,
    fontWeight: '500',
  },
  tableContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  ibanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  copyButton: {
    padding: 6,
    borderRadius: BorderRadius.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    ...Typography.body,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

