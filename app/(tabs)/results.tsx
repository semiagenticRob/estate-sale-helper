import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SaleCard } from '../../components/SaleCard';
import { ResultsMap } from '../../components/ResultsMap';
import { HeatLegend } from '../../components/HeatLegend';
import { useSavedSales } from '../../hooks/useSavedSales';
import { searchSales } from '../../lib/salesApi';
import { getSaleScores } from '../../lib/communityApi';
import { DateRange, SearchResult, SaleScore } from '../../types';
import { colors, fonts, fontSize, spacing, radii } from '../../lib/theme';

const DATE_RANGE_LABELS: Partial<Record<DateRange, string>> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
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
    viewMode?: string;
  }>();
  const { toggleSave, isSaved } = useSavedSales();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Map<string, SaleScore>>(new Map());
  const [viewMode, setViewMode] = useState<'list' | 'map'>(
    params.viewMode === 'list' ? 'list' : 'map'
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    (params.dateRange as DateRange) || 'today'
  );

  const hasQuery = Boolean(params.query?.trim());
  const radius = parseInt(params.radius || '100', 10);

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
        if (!cancelled) {
          setResults(data);
          if (data.length > 0) {
            getSaleScores(data.map((s) => s.id)).then((s) => {
              if (!cancelled) setScores(s);
            }).catch(() => {});
          }
        }
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
              {params.statewide ? `All sales in ${params.statewide}` : `Within ${radius} mi`}
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

      {/* Date selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateChips}
        style={styles.dateChipBar}
      >
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((dr) => (
          <Pressable
            key={dr}
            style={[styles.dateChip, dateRange === dr && styles.dateChipActive]}
            onPress={() => setDateRange(dr)}
          >
            <Text style={[styles.dateChipText, dateRange === dr && styles.dateChipTextActive]}>
              {DATE_RANGE_LABELS[dr]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!loading && results.length > 0 && <HeatLegend />}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} style={{ marginBottom: spacing.base }} />
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              searchSales({
                query: params.query || '',
                latitude: parseFloat(params.latitude || '39.7392'),
                longitude: parseFloat(params.longitude || '-104.9903'),
                radiusMiles: radius,
                dateRange,
                stateCode: params.statewide || undefined,
              })
                .then(setResults)
                .catch(() => setError('Could not load results. Please try again.'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
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
          isSaved={isSaved}
          onToggleSave={toggleSave}
          scores={scores}
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
  dateChipBar: {
    flexGrow: 0,
    backgroundColor: colors.backgroundSecondary,
  },
  dateChips: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.chip,
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  dateChipActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  dateChipText: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: colors.white,
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
  retryButton: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accentPrimary,
    borderRadius: radii.button,
  },
  retryText: {
    color: colors.white,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    fontSize: fontSize.uiButton,
  },
});
