import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SaleCard } from '../../components/SaleCard';
import { useSavedSales } from '../../hooks/useSavedSales';
import { searchSales } from '../../lib/salesApi';
import { DateRange, SearchResult } from '../../types';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  next3days: 'Next 3 Days',
  thisweek: 'This Week',
  all: 'All Dates',
};

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    query: string;
    latitude: string;
    longitude: string;
    radius: string;
    dateRange: string;
    statewide?: string;
  }>();
  const { toggleSave, isSaved } = useSavedSales();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasQuery = Boolean(params.query?.trim());
  const radius = parseInt(params.radius || '25', 10);
  const dateRange = (params.dateRange as DateRange) || 'thisweek';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchSales({
      query: params.query || '',
      latitude: parseFloat(params.latitude || '39.7392'),
      longitude: parseFloat(params.longitude || '-104.9903'),
      radiusMiles: radius,
      dateRange,
      stateCode: params.statewide || undefined,
    })
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load results. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [params.query, params.latitude, params.longitude, radius, dateRange]);

  return (
    <View style={styles.container}>
      {/* Results header */}
      <View style={styles.header}>
        <Text style={styles.headerCount}>
          {loading ? 'Searching…' : `${results.length} sale${results.length !== 1 ? 's' : ''}${hasQuery ? ` for "${params.query}"` : ''}`}
        </Text>
        <Text style={styles.headerMeta}>
          {params.statewide ? `All sales in ${params.statewide}` : `Within ${radius} mi`} · {DATE_RANGE_LABELS[dateRange]}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3A3830" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyText}>No sales found</Text>
          <Text style={styles.emptyHint}>
            Try expanding your distance or date range
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SaleCard
              sale={item}
              isSaved={isSaved(item.id)}
              hasQuery={hasQuery}
              onPress={() => router.push(`/sale/${item.id}`)}
              onToggleSave={() => toggleSave(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EAE2',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F0E8',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E0',
  },
  headerCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1A16',
  },
  headerMeta: {
    fontSize: 13,
    color: '#A8A09A',
    marginTop: 2,
  },
  list: {
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1A16',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: '#A8A09A',
    textAlign: 'center',
  },
});
