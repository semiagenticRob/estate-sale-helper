import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { HeaderBackButton } from '@react-navigation/elements';
import { Image } from 'expo-image';
import { getLastSearch } from '../../lib/searchState';
import { useSavedSales } from '../../hooks/useSavedSales';
import { getSaleById } from '../../lib/salesApi';
import { Sale } from '../../types';
import { getSaleStatus, formatDate } from '../../lib/dates';
import { colors, fonts, fontSize, spacing, radii, shadows } from '../../lib/theme';

export default function SavedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { savedSales, toggleSave } = useSavedSales();
  const [salesData, setSalesData] = useState<(Sale & { savedAt: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton
          tintColor={colors.textPrimary}
          onPress={() => {
            const last = getLastSearch();
            if (last) {
              router.navigate({ pathname: '/results', params: last });
            } else {
              router.navigate('/');
            }
          }}
        />
      ),
    });
  }, [navigation, router]);

  const [fetchError, setFetchError] = useState(false);

  // Fetch full sale data from Supabase whenever saved list changes or tab is focused
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function fetchSales() {
        setLoading(true);
        setFetchError(false);
        try {
          const fetched = await Promise.all(
            savedSales.map(async (saved) => {
              try {
                const sale = await getSaleById(saved.saleId);
                return sale ? { ...sale, savedAt: saved.savedAt } : null;
              } catch {
                return null;
              }
            })
          );
          if (!cancelled) {
            setSalesData(fetched.filter((s): s is Sale & { savedAt: string } => s !== null));
          }
        } catch {
          if (!cancelled) setFetchError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      fetchSales();
      return () => { cancelled = true; };
    }, [savedSales])
  );

  const savedSaleData = salesData;

  if (loading && savedSales.length > 0) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>!</Text>
        <Text style={styles.emptyTitle}>Could not load saved sales</Text>
        <Text style={styles.emptyHint}>
          Check your connection and try again
        </Text>
      </View>
    );
  }

  if (savedSaleData.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>☆</Text>
        <Text style={styles.emptyTitle}>No saved sales yet</Text>
        <Text style={styles.emptyHint}>
          Star sales from search results to save them here for quick access
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={savedSaleData}
        keyExtractor={(item) => item!.id}
        renderItem={({ item }) => {
          if (!item) return null;
          const headerImage = item.images[0]?.imageUrl;
          const status = getSaleStatus(item.startDate, item.endDate);

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/sale/${item.id}`)}
            >
              {headerImage && (
                <Image
                  source={{ uri: headerImage }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {item.city}, {item.state}
                </Text>
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.statusDot,
                      status === 'active' || status === 'ending'
                        ? styles.statusActive
                        : status === 'upcoming'
                          ? styles.statusUpcoming
                          : styles.statusEnded,
                    ]}
                  />
                  <Text style={styles.statusLabel}>
                    {status === 'active'
                      ? 'Happening Now'
                      : status === 'ending'
                        ? 'Last Day'
                        : status === 'upcoming'
                          ? `Starts ${formatDate(item.startDate)}`
                          : 'Ended'}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => toggleSave(item.id)}
              >
                <Text style={styles.removeIcon}>★</Text>
              </Pressable>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.backgroundPrimary,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.separator,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bodySerif,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: fontSize.uiButton,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: radii.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: fontSize.uiCaption,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: colors.statusActive,
  },
  statusUpcoming: {
    backgroundColor: colors.statusUpcoming,
  },
  statusEnded: {
    backgroundColor: colors.statusEnded,
  },
  statusLabel: {
    fontSize: fontSize.uiLabel,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
  },
  removeBtn: {
    justifyContent: 'center',
    paddingHorizontal: spacing.listItemVertical,
  },
  removeIcon: {
    fontSize: 24,
    color: colors.accentPrimary,
  },
});
