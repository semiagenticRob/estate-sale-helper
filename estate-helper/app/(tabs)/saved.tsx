import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSavedSales } from '../../hooks/useSavedSales';
import { mockSales } from '../../data/mockSales';

export default function SavedScreen() {
  const router = useRouter();
  const { savedSales, toggleSave } = useSavedSales();

  // Get full sale data for saved IDs
  const savedSaleData = savedSales
    .map((saved) => {
      const sale = mockSales.find((s) => s.id === saved.saleId);
      return sale ? { ...sale, savedAt: saved.savedAt } : null;
    })
    .filter(Boolean);

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
          const startDate = new Date(item.startDate);
          const endDate = new Date(item.endDate);
          const now = new Date();
          const isActive = now >= startDate && now <= endDate;
          const isUpcoming = now < startDate;

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
                      isActive
                        ? styles.statusActive
                        : isUpcoming
                          ? styles.statusUpcoming
                          : styles.statusEnded,
                    ]}
                  />
                  <Text style={styles.statusLabel}>
                    {isActive
                      ? 'Happening Now'
                      : isUpcoming
                        ? `Starts ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
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
    backgroundColor: '#f5f5f5',
  },
  list: {
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fafafa',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#ccc',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
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
    color: '#1a1a1a',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 13,
    color: '#666',
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
    backgroundColor: '#4caf50',
  },
  statusUpcoming: {
    backgroundColor: '#2196f3',
  },
  statusEnded: {
    backgroundColor: '#bbb',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  removeBtn: {
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  removeIcon: {
    fontSize: 24,
    color: '#f5a623',
  },
});
