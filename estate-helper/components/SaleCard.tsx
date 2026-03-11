import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SearchResult } from '../types';

interface SaleCardProps {
  sale: SearchResult;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

export function SaleCard({ sale, isSaved, onPress, onToggleSave }: SaleCardProps) {
  const saleStatus = getSaleStatus(sale.startDate, sale.endDate);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Header Image */}
      {sale.headerImageUrl ? (
        <Image
          source={{ uri: sale.headerImageUrl }}
          style={styles.headerImage}
          contentFit="cover"
          placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
          transition={200}
        />
      ) : (
        <View style={[styles.headerImage, styles.noImage]}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}

      {/* Match Badge */}
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{sale.matchPercent}% match</Text>
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={onToggleSave}>
        <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
      </Pressable>

      {/* Card Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {sale.title}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {sale.companyName || sale.city + ', ' + sale.state}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {sale.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {sale.distanceMiles !== null ? (
              <Text style={styles.distance}>{sale.distanceMiles} mi away</Text>
            ) : (
              <View style={[styles.statusBadge, styles.noAddress]}>
                <Text style={styles.statusText}>Address TBD</Text>
              </View>
            )}
            <View style={[styles.statusBadge, styles[saleStatus]]}>
              <Text style={styles.statusText}>
                {saleStatus === 'active'
                  ? 'Happening Now'
                  : saleStatus === 'upcoming'
                    ? 'Upcoming'
                    : 'Ending Soon'}
              </Text>
            </View>
          </View>
          <Text style={styles.dates}>
            {formatDateRange(sale.startDate, sale.endDate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function getSaleStatus(startDate: string, endDate: string): 'active' | 'upcoming' | 'ending' {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'ending'; // Already ended but still showing
  // Check if it's the last day
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (endDay.getTime() === today.getTime()) return 'ending';
  return 'active';
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-US', opts);
  }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: 180,
  },
  noImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 16,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#1a5f2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIcon: {
    fontSize: 22,
    color: '#f5a623',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distance: {
    fontSize: 13,
    color: '#1a5f2a',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  active: {
    backgroundColor: '#e8f5e9',
  },
  upcoming: {
    backgroundColor: '#e3f2fd',
  },
  ending: {
    backgroundColor: '#fff3e0',
  },
  noAddress: {
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  dates: {
    fontSize: 13,
    color: '#888',
  },
});
