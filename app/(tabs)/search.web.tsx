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
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Theme';
import { useResponsive } from '../../utils/responsive';
import HoverCard from '../../components/web/HoverCard';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
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
    <View style={styles.container}>
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
            <Text style={styles.pageTitle}>Пошук</Text>
          )}

          <View style={styles.searchContainer}>
            {/* Desktop: Checkbox selection */}
            {isDesktop ? (
              <View style={styles.desktopSourcesContainer}>
                <Text style={styles.sourcesLabel}>Джерела:</Text>
                <View style={styles.checkboxGrid}>
                  <TouchableOpacity 
                    style={styles.desktopCheckboxItem}
                    onPress={() => toggleSource('all')}
                  >
                    <View style={styles.checkbox}>
                      {selectedSources.includes('all') && (
                        <MaterialIcons name="check" size={18} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Всі сайти</Text>
                  </TouchableOpacity>
                  
                  {SOURCES.filter(s => s.id !== 'all').map((source) => (
                    <TouchableOpacity 
                      key={source.id}
                      style={styles.desktopCheckboxItem}
                      onPress={() => toggleSource(source.id)}
                    >
                      <View style={styles.checkbox}>
                        {selectedSources.includes(source.id) && (
                          <MaterialIcons name="check" size={18} color={Colors.primary} />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{source.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.inputWrapper} pointerEvents="box-none">
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Введіть запит..."
                placeholderTextColor="#7f8c8d"
                style={styles.input}
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
                  style={styles.sourceSelector}
                  onPress={() => setShowSourceModal(true)}
                >
                  <Text style={styles.sourceSelectorText} numberOfLines={1}>
                    {getSelectedSourcesLabel()}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
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
              <View style={styles.modalOverlay}>
                <TouchableOpacity 
                  style={styles.modalBackdrop} 
                  activeOpacity={1}
                  onPress={() => setShowSourceModal(false)}
                />
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Оберіть джерела</Text>
                    <TouchableOpacity onPress={() => setShowSourceModal(false)}>
                      <Text style={styles.modalDoneButton}>Готово</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.sourcesList}>
                    <TouchableOpacity 
                      style={styles.sourceItem}
                      onPress={() => toggleSource('all')}
                    >
                      <View style={styles.checkbox}>
                        {selectedSources.includes('all') && (
                          <MaterialIcons name="check" size={20} color={Colors.primary} />
                        )}
                      </View>
                      <Text style={styles.sourceItemText}>Всі сайти</Text>
                    </TouchableOpacity>
                    
                    {SOURCES.filter(s => s.id !== 'all').map((source) => (
                      <TouchableOpacity 
                        key={source.id}
                        style={styles.sourceItem}
                        onPress={() => toggleSource(source.id)}
                      >
                        <View style={styles.checkbox}>
                          {selectedSources.includes(source.id) && (
                            <MaterialIcons name="check" size={20} color={Colors.primary} />
                          )}
                        </View>
                        <Text style={styles.sourceItemText}>{source.label}</Text>
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
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Шукаємо результати...</Text>
                <Text style={styles.loadingSubtext}>
                  Пошук на {selectedSources.includes('all') ? 'всіх сайтах' : `${selectedSources.length} сайт${selectedSources.length > 1 ? 'ах' : 'і'}`}
                </Text>
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            {!loading && !error && results.length === 0 && (
              <View style={styles.placeholderContainer}>
                <MaterialIcons name="search" size={64} color="#34495e" />
                <Text style={styles.placeholder}>Введіть запит і натисніть "Знайти"</Text>
                <Text style={styles.placeholderSubtext}>
                  Пошук у офіційних джерелах бухгалтерської інформації
                </Text>
              </View>
            )}
            {!loading && !error && results.length > 0 && (
              <View>
                  <Text style={styles.resultsCount}>
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
    backgroundColor: Colors.background 
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    color: Colors.textPrimary,
    minHeight: 48,
    outlineStyle: 'none' as any,
  },
  sourceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderLeftColor: Colors.background,
    minWidth: 100,
    maxWidth: 140,
  },
  sourceSelectorText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Typography.body.fontFamily,
    fontWeight: '600',
    flex: 1,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  modalDoneButton: {
    color: Colors.primary,
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
    borderBottomColor: Colors.background,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
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
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  loadingSubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
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
    color: Colors.textSecondary, 
    textAlign: 'center', 
    marginTop: Spacing.lg, 
    fontWeight: '600',
  },
  placeholderSubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  resultsCount: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
    lineHeight: 22,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    lineHeight: 22,
  },
});

