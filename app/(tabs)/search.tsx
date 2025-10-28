import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SOURCES } from '../../constants/sources';
import { SearchResultCard } from '../../components/SearchResultCard';
import { searchMultipleSources, SearchResult } from '../../utils/searchService';

export default function SearchScreen() {
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
      // Выполняем поиск по выбранным источникам
      const searchResults = await searchMultipleSources(query.trim(), selectedSources);
      
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Введіть запит..."
            placeholderTextColor="#7f8c8d"
            style={styles.input}
          />
          <TouchableOpacity 
            style={styles.sourceSelector}
            onPress={() => setShowSourceModal(true)}
          >
            <Text style={styles.sourceSelectorText} numberOfLines={1}>
              {getSelectedSourcesLabel()}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#00bfa5" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sources Selection Modal */}
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
                    <MaterialIcons name="check" size={20} color="#00bfa5" />
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
                      <MaterialIcons name="check" size={20} color="#00bfa5" />
                    )}
                  </View>
                  <Text style={styles.sourceItemText}>{source.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

            <View style={styles.results}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00bfa5" />
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
                    />
                  ))}
                </View>
              )}
            </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1d21' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00bfa5',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ecf0f1',
  },
  sourceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#1a1d21',
    minWidth: 100,
    maxWidth: 140,
  },
  sourceSelectorText: {
    color: '#00bfa5',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#00bfa5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '70%',
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
  modalDoneButton: {
    color: '#00bfa5',
    fontSize: 16,
    fontWeight: '600',
  },
  sourcesList: {
    paddingVertical: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d21',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00bfa5',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceItemText: {
    color: '#ecf0f1',
    fontSize: 16,
    flex: 1,
  },
  results: { padding: 16 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#00bfa5',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  placeholder: { 
    color: '#bdc3c7', 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  resultsCount: {
    color: '#00bfa5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
    padding: 20,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    lineHeight: 22,
  },
});
