// app/(tabs)/search.web.tsx - WEB VERSION
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SOURCES } from '../../constants/sources';
import { SearchResultCard } from '../../components/SearchResultCard.web';
import { searchMultipleSources, SearchResult } from '../../utils/searchService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '../../constants/Theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { useSEO } from '../../hooks/useSEO';
import { PAGE_METAS } from '../../utils/seo';
import HoverCard from '../../components/web/HoverCard';

export default function SearchScreen() {
  useSEO(PAGE_METAS.search);
  
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['all']);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);

  const toggleSource = (sourceId: string) => {
    if (sourceId === 'all') {
      setSelectedSources(['all']);
    } else {
      const newSources = selectedSources.filter(id => id !== 'all');
      if (newSources.includes(sourceId)) {
        const filtered = newSources.filter(id => id !== sourceId);
        setSelectedSources(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setSelectedSources([...newSources, sourceId]);
      }
    }
  };

  const getSelectedSourcesLabel = () => {
    if (selectedSources.includes('all') || selectedSources.length === 0) {
      return 'Всі';
    }
    if (selectedSources.length === 1) {
      const source = SOURCES.find(s => s.id === selectedSources[0]);
      return source?.label || 'Всі';
    }
    return `Обрано: ${selectedSources.length}`;
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Будь ласка, введіть пошуковий запит');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Преобразуем ID источников в домены для API
      let domainsToSearch: string[];
      
      if (selectedSources.includes('all') || selectedSources.length === 0) {
        domainsToSearch = ['all'];
      } else {
        // Получаем домены для выбранных source IDs
        domainsToSearch = selectedSources
          .map(id => SOURCES.find(s => s.id === id)?.domain)
          .filter(domain => domain && domain !== '') as string[];
      }
      
      console.log('Search domains:', domainsToSearch);
      
      // Выполняем поиск по выбранным источникам
      const searchResults = await searchMultipleSources(query.trim(), domainsToSearch);
      
      if (searchResults.length === 0) {
        setError('За вашим запитом нічого не знайдено. Спробуйте інші ключові слова.');
      } else {
        setResults(searchResults);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Помилка під час пошуку. Перевірте підключення до інтернету та спробуйте ще раз.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
          { paddingTop: insets.bottom + 16 }
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          {/* Заголовок для Desktop */}
          {isDesktop && (
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Пошук</Text>
          )}

          <View style={styles.searchContainer}>
            {/* Desktop: Checkbox selection */}
            {isDesktop ? (
              <View style={styles.desktopSourcesContainer}>
                <Text style={[styles.sourcesLabel, { color: colors.textPrimary }]}>Джерела:</Text>
                <View style={styles.checkboxGrid}>
                  <TouchableOpacity 
                    style={styles.desktopCheckboxItem}
                    onPress={() => toggleSource('all')}
                  >
                    <View style={[styles.checkbox, { borderColor: colors.primary }]}>
                      {selectedSources.includes('all') && (
                        <MaterialIcons name="check" size={18} color={colors.primary} />
                      )}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Всі сайти</Text>
                  </TouchableOpacity>
                  
                  {SOURCES.filter(s => s.id !== 'all').map((source) => (
                    <TouchableOpacity 
                      key={source.id}
                      style={styles.desktopCheckboxItem}
                      onPress={() => toggleSource(source.id)}
                    >
                      <View style={[styles.checkbox, { borderColor: colors.primary }]}>
                        {selectedSources.includes(source.id) && (
                          <MaterialIcons name="check" size={18} color={colors.primary} />
                        )}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>{source.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]} pointerEvents="box-none">
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Введіть запит..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.textPrimary }]}
                editable={true}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                keyboardAppearance="dark"
                selectTextOnFocus={true}
              />
              {/* Mobile: Source selector */}
              {!isDesktop && (
                <TouchableOpacity 
                  style={[styles.sourceSelector, { borderLeftColor: colors.background }]}
                  onPress={() => setShowSourceModal(true)}
                >
                  <Text style={[styles.sourceSelectorText, { color: colors.primary }]} numberOfLines={1}>
                    {getSelectedSourcesLabel()}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch}>
              <MaterialIcons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Sources Selection Modal (только для Mobile) */}
          {!isDesktop && (
            <Modal
              visible={showSourceModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowSourceModal(false)}
            >
              <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                <TouchableOpacity 
                  style={styles.modalBackdrop} 
                  activeOpacity={1}
                  onPress={() => setShowSourceModal(false)}
                />
                <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.background }]}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Оберіть джерела</Text>
                    <TouchableOpacity onPress={() => setShowSourceModal(false)}>
                      <Text style={[styles.modalDoneButton, { color: colors.primary }]}>Готово</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.sourcesList}>
                    <TouchableOpacity 
                      style={[styles.sourceItem, { borderBottomColor: colors.background }]}
                      onPress={() => toggleSource('all')}
                    >
                      <View style={[styles.checkbox, { borderColor: colors.primary }]}>
                        {selectedSources.includes('all') && (
                          <MaterialIcons name="check" size={20} color={colors.primary} />
                        )}
                      </View>
                      <Text style={[styles.sourceItemText, { color: colors.textPrimary }]}>Всі сайти</Text>
                    </TouchableOpacity>
                    
                    {SOURCES.filter(s => s.id !== 'all').map((source) => (
                      <TouchableOpacity 
                        key={source.id}
                        style={[styles.sourceItem, { borderBottomColor: colors.background }]}
                        onPress={() => toggleSource(source.id)}
                      >
                        <View style={[styles.checkbox, { borderColor: colors.primary }]}>
                          {selectedSources.includes(source.id) && (
                            <MaterialIcons name="check" size={20} color={colors.primary} />
                          )}
                        </View>
                        <Text style={[styles.sourceItemText, { color: colors.textPrimary }]}>{source.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}

          <View style={styles.results}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.primary }]}>Шукаємо результати...</Text>
                <Text style={[styles.loadingSubtext, { color: colors.textMuted }]}>
                  Пошук на {selectedSources.includes('all') ? 'всіх сайтах' : `${selectedSources.length} сайт${selectedSources.length > 1 ? 'ах' : 'і'}`}
                </Text>
              </View>
            )}
            {error && <Text style={[styles.errorText, { color: colors.error, backgroundColor: colors.cardBackground }]}>{error}</Text>}
            {!loading && !error && results.length === 0 && (
              <View style={styles.placeholderContainer}>
                <MaterialIcons name="search" size={64} color={colors.textMuted} />
                <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Введіть запит і натисніть "Знайти"</Text>
                <Text style={[styles.placeholderSubtext, { color: colors.textMuted }]}>
                  Пошук у офіційних джерелах бухгалтерської інформації
                </Text>
              </View>
            )}
            {!loading && !error && results.length > 0 && (
              <View>
                  <Text style={[styles.resultsCount, { color: colors.textPrimary }]}>
                    Знайдено результатів: {results.length}
                  </Text>
                  {results.map((result, i) => (
                    <SearchResultCard
                      key={`${result.url}-${i}`}
                      title={result.title}
                      description={result.description}
                      url={result.url}
                      site={result.source}
                      onPress={() => handleResultClick(result.url)}
                    />
                  ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  desktopContent: {
    maxWidth: 1440,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
    width: '100%',
  },
  pageTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  searchContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  desktopSourcesContainer: {
    marginBottom: Spacing.md,
  },
  sourcesLabel: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  desktopCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkboxLabel: {
    ...Typography.body,
    fontSize: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    minHeight: 48,
    outlineStyle: 'none' as any,
  },
  sourceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderLeftWidth: 1,
    minWidth: 100,
    maxWidth: 140,
  },
  sourceSelectorText: {
    fontSize: 14,
    fontFamily: Typography.body.fontFamily,
    fontWeight: '600',
    flex: 1,
  },
  searchButton: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h4,
  },
  modalDoneButton: {
    fontSize: 16,
    fontFamily: Typography.body.fontFamily,
    fontWeight: '600',
  },
  sourcesList: {
    paddingVertical: Spacing.sm,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceItemText: {
    ...Typography.body,
    flex: 1,
  },
  results: { 
    padding: Spacing.md 
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  loadingSubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  placeholder: { 
    ...Typography.body,
    textAlign: 'center', 
    marginTop: Spacing.lg, 
    fontWeight: '600',
  },
  placeholderSubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  resultsCount: {
    ...Typography.h4,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
    lineHeight: 22,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    lineHeight: 22,
  },
});

