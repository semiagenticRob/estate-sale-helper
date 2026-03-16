import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ImageGallery } from '../../components/ImageGallery';
import { SaleMap } from '../../components/SaleMap';
import { useSavedSales } from '../../hooks/useSavedSales';
import { getSaleById } from '../../lib/salesApi';
import { Sale } from '../../types';
import { formatDate } from '../../lib/dates';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleSave, isSaved } = useSavedSales();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getSaleById(id)
      .then(setSale)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3A3830" />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Sale not found</Text>
      </View>
    );
  }

  const handleGetDirections = () => {
    const address = encodeURIComponent(
      `${sale.address}, ${sale.city}, ${sale.state} ${sale.zipCode}`
    );
    Linking.openURL(`https://maps.google.com/?q=${address}`);
  };

  const handleViewOriginal = () => {
    if (sale.url) Linking.openURL(sale.url);
  };

  const saved = isSaved(sale.id);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <ImageGallery images={sale.images} />

        <View style={styles.content}>
          {/* Title and Save */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{sale.title}</Text>
            <Pressable
              style={[styles.saveBtn, saved && styles.saveBtnActive]}
              onPress={() => toggleSave(sale.id)}
            >
              <Text style={styles.saveBtnText}>
                {saved ? '★ Saved' : '☆ Save'}
              </Text>
            </Pressable>
          </View>

          {sale.companyName && (
            <Text style={styles.company}>by {sale.companyName}</Text>
          )}

          {/* Date and Location */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>
                {formatDate(sale.startDate, true)} – {formatDate(sale.endDate, true)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>
                {sale.address}, {sale.city}, {sale.state} {sale.zipCode}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={handleGetDirections}>
              <Text style={styles.actionBtnText}>Get Directions</Text>
            </Pressable>
            {sale.url && (
              <Pressable
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={handleViewOriginal}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                  View on EstateSales.net
                </Text>
              </Pressable>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Sale</Text>
            <Text style={styles.description}>{sale.description}</Text>
          </View>

          {/* Map */}
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <SaleMap latitude={sale.latitude} longitude={sale.longitude} />
          </View>

          {/* Images Grid */}
          {sale.images.length > 0 && (
            <View style={styles.imagesSection}>
              <Text style={styles.sectionTitle}>Images</Text>
              <View style={styles.imageGrid}>
                {sale.images.map((img) => (
                  <View key={img.id} style={styles.imageGridItem}>
                    <Image
                      source={{ uri: img.imageUrl }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 10 }]}>
        <Pressable style={styles.tabItem} onPress={() => router.navigate('/')}>
          <Text style={styles.tabIcon}>🔍</Text>
          <Text style={styles.tabLabel}>Search</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => router.navigate('/saved')}>
          <Text style={styles.tabIcon}>★</Text>
          <Text style={styles.tabLabel}>Saved</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  scrollContent: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#A8A09A',
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1A16',
    flex: 1,
    marginRight: 12,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C49A6C',
  },
  saveBtnActive: {
    backgroundColor: '#F5EDDF',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C49A6C',
  },
  company: {
    fontSize: 15,
    color: '#7A7269',
    marginBottom: 16,
  },
  infoSection: {
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    fontSize: 15,
    color: '#3A3830',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#3A3830',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#3A3830',
  },
  actionBtnText: {
    color: '#FAF7F2',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnTextSecondary: {
    color: '#3A3830',
  },
  descriptionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1A16',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#5A5550',
    lineHeight: 24,
  },
  mapSection: {
    marginBottom: 30,
  },
  imagesSection: {
    marginBottom: 30,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  imageGridItem: {
    width: (Dimensions.get('window').width - 40 - 6) / 2,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EDE8E0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F2',
    borderTopWidth: 1,
    borderTopColor: '#EDE8E0',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 22,
    color: '#A8A09A',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#A8A09A',
    fontWeight: '600',
  },
});
