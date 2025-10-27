import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SOURCES } from '../../constants/sources';
import { SearchResultCard } from '../../components/SearchResultCard';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      // TODO: подключим настоящий API позже
      const mockResults = [
        {
          title: 'Як подати звітність через Електронний кабінет',
          site: 'tax.gov.ua',
          link: 'https://tax.gov.ua/help/',
        },
        {
          title: 'Порядок заповнення декларації з ПДВ',
          site: 'zakon.rada.gov.ua',
          link: 'https://zakon.rada.gov.ua/laws/show/z1234-21',
        },
      ];

      setResults(mockResults);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Пошук документів</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Введіть запит..."
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Знайти</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sources}>
        {SOURCES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.sourceBtn,
              selectedSource === s.id && styles.sourceBtnActive,
            ]}
            onPress={() => setSelectedSource(s.id)}
          >
            <Text
              style={[
                styles.sourceText,
                selectedSource === s.id && styles.sourceTextActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.results}>
        {loading && <Text>Завантаження...</Text>}
        {!loading && results.length === 0 && (
          <Text style={styles.placeholder}>Результати зʼявляться тут</Text>
        )}
        {results.map((r, i) => (
          <SearchResultCard key={i} {...r} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { backgroundColor: '#002b6b', padding: 16 },
  headerText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  form: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#002b6b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  sources: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  sourceBtn: {
    backgroundColor: '#e6eaf5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBtnActive: { backgroundColor: '#002b6b' },
  sourceText: { color: '#002b6b', fontWeight: '500' },
  sourceTextActive: { color: '#fff' },
  results: { padding: 16 },
  placeholder: { color: '#777', textAlign: 'center', marginTop: 20 },
});
