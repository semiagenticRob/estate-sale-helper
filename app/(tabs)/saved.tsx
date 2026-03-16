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
          tintColor="#1C1A16"
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

  // Fetch full sale data from Supabase whenever saved list changes or tab is focused
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function fetchSales() {
        setLoading(true);
        const results: (Sale & { savedAt: string })[] = [];
        for (const saved of savedSales) {
          const sale = await getSaleById(saved.saleId);
          if (sale && !cancelled) {
            results.push({ ...sale, savedAt: saved.savedAt });
          }
        }
        if (!cancelled) {
          setSalesData(results);
          setLoading(false);
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
        <ActivityIndicator size="large" color="#3A3830" />
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
    backgroundColor: '#F0EAE2',
  },
  list: {
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FAF7F2',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#DDD8CE',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1A16',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#A8A09A',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF9',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3A3830',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1A16',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 13,
    color: '#7A7269',
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#5A8A60',
  },
  statusUpcoming: {
    backgroundColor: '#5070A0',
  },
  statusEnded: {
    backgroundColor: '#A8A09A',
  },
  statusLabel: {
    fontSize: 12,
    color: '#7A7269',
  },
  removeBtn: {
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  removeIcon: {
    fontSize: 24,
    color: '#C49A6C',
  },
});
