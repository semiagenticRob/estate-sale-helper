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
  const startDate = new Date(sale.startDate);
  const endDate = new Date(sale.endDate);
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

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
              {startDate.toLocaleDateString('en-US', dateOpts)} -{' '}
              {endDate.toLocaleDateString('en-US', dateOpts)}
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

        {/* Reminder placeholder */}
        <Pressable style={styles.reminderBtn}>
          <Text style={styles.reminderBtnText}>🔔 Set Reminder</Text>
          <Text style={styles.reminderHint}>Coming soon</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
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
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f5a623',
  },
  saveBtnActive: {
    backgroundColor: '#fff8e7',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5a623',
  },
  company: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  infoSection: {
    backgroundColor: '#f8f8f8',
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
    color: '#333',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1a5f2a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1a5f2a',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnTextSecondary: {
    color: '#1a5f2a',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 30,
  },
  reminderBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  reminderHint: {
    fontSize: 12,
    color: '#999',
  },
});
