import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ImageGallery } from '../../components/ImageGallery';
import { useSavedSales } from '../../hooks/useSavedSales';
import { mockSales } from '../../data/mockSales';
import { formatDate } from '../../lib/dates';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleSave, isSaved } = useSavedSales();

  const sale = mockSales.find((s) => s.id === id);

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
    if (sale.url) {
      Linking.openURL(sale.url);
    }
  };

  const saved = isSaved(sale.id);

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <ImageGallery images={sale.images} />

      {/* Content */}
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

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9',
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
});
