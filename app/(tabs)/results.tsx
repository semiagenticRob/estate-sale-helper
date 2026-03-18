import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SaleCard } from '../../components/SaleCard';
import { ResultsMap } from '../../components/ResultsMap';
import { useSavedSales } from '../../hooks/useSavedSales';
import { searchSales } from '../../lib/salesApi';
import { DateRange, SearchResult } from '../../types';
import { colors, fonts, fontSize, spacing, radii } from '../../lib/theme';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisweekend: 'This Weekend',
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerCount}>
              {loading ? 'Searching…' : `${results.length} sale${results.length !== 1 ? 's' : ''}${hasQuery ? ` for "${params.query}"` : ''}`}
            </Text>
            <Text style={styles.headerMeta}>
              {params.statewide ? `All sales in ${params.statewide}` : `Within ${radius} mi`} · {DATE_RANGE_LABELS[dateRange]}
            </Text>
          </View>
          {!loading && results.length > 0 && (
            <Pressable
              style={styles.toggleButton}
              onPress={() => setViewMode((v) => (v === 'list' ? 'map' : 'list'))}
            >
              <Ionicons
                name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
                size={15}
                color={colors.accentPrimary}
              />
              <Text style={styles.toggleLabel}>{viewMode === 'list' ? 'Map' : 'List'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>No Results</Text>
          <Text style={styles.emptyText}>No sales found</Text>
          <Text style={styles.emptyHint}>
            Try expanding your distance or date range
          </Text>
        </View>
      ) : viewMode === 'map' ? (
        <ResultsMap
          results={results}
          centerLat={parseFloat(params.latitude || '39.7392')}
          centerLng={parseFloat(params.longitude || '-104.9903')}
          radius={radius}
          onSalePress={(id) => router.push(`/sale/${id}`)}
        />
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
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerCount: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  headerMeta: {
    fontSize: fontSize.uiCaption,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    marginTop: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
  },
  toggleLabel: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.base,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts.bodySerif,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: fontSize.uiButton,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    textAlign: 'center',
  },
});
