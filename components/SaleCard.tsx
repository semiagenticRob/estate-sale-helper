import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SearchResult } from '../types';
import { formatDateRange, getSaleStatus, SaleStatus } from '../lib/dates';

interface SaleCardProps {
  sale: SearchResult;
  isSaved: boolean;
  hasQuery: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

const STATUS_LABELS: Record<SaleStatus, string> = {
  active: 'Happening Now',
  upcoming: 'Upcoming',
  ending: 'Last Day',
  ended: 'Ended',
};

const STATUS_BADGE_COLORS: Record<SaleStatus, string> = {
  active: '#E6EDE7',
  upcoming: '#E3E8F0',
  ending: '#F0E8DC',
  ended: '#ECEAE7',
};

const STATUS_TEXT_COLORS: Record<SaleStatus, string> = {
  active: '#3D6B42',
  upcoming: '#394E6E',
  ending: '#8B5E30',
  ended: '#857E78',
};

export function SaleCard({ sale, isSaved, hasQuery, onPress, onToggleSave }: SaleCardProps) {
  const status = getSaleStatus(sale.startDate, sale.endDate);

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

      {/* Match Badge — only shown when a query was entered */}
      {hasQuery && (
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{sale.matchPercent}% match</Text>
        </View>
      )}

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={onToggleSave}>
        <Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>
          {isSaved ? '★' : '☆'}
        </Text>
      </Pressable>

      {/* Card Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {sale.title}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {sale.companyName || `${sale.city}, ${sale.state}`}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {sale.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.distance}>{sale.distanceMiles} mi</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_BADGE_COLORS[status] }]}>
              <Text style={[styles.statusText, { color: STATUS_TEXT_COLORS[status] }]}>
                {STATUS_LABELS[status]}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
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
    backgroundColor: '#EDE8E0',
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
    backgroundColor: '#3A3830',
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
    color: '#ccc',
  },
  saveIconActive: {
    color: '#C49A6C',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1A16',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#7A7269',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#5A5550',
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
    color: '#3A3830',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dates: {
    fontSize: 13,
    color: '#A8A09A',
  },
});
