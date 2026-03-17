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
import { detectPaymentTypes } from '../lib/paymentTypes';
import { colors, fonts, fontSize, spacing, radii, shadows } from '../lib/theme';

interface SaleCardProps {
  sale: SearchResult;
  isSaved: boolean;
  hasQuery: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

const STATUS_LABELS: Record<SaleStatus, string> = {
  active: 'Happening Now',
  startingsoon: 'Starting Soon',
  upcoming: 'Upcoming',
  ending: 'Last Day',
  ended: 'Ended',
};

const STATUS_BADGE_COLORS: Record<SaleStatus, string> = {
  active: colors.statusActiveBg,
  startingsoon: colors.statusEndingBg,
  upcoming: colors.statusUpcomingBg,
  ending: colors.statusEndingBg,
  ended: colors.statusEndedBg,
};

const STATUS_TEXT_COLORS: Record<SaleStatus, string> = {
  active: colors.statusActiveText,
  startingsoon: colors.statusEndingText,
  upcoming: colors.statusUpcomingText,
  ending: colors.statusEndingText,
  ended: colors.statusEndedText,
};

export function SaleCard({ sale, isSaved, hasQuery, onPress, onToggleSave }: SaleCardProps) {
  const status = getSaleStatus(sale.startDate, sale.endDate, sale.saleHours);
  const payments = detectPaymentTypes(sale.terms, sale.description);

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

        {payments.length > 0 && (
          <View style={styles.paymentRow}>
            {payments.map((p) => (
              <View key={p.type} style={[styles.paymentBadge, { backgroundColor: p.bgColor }]}>
                <Text style={[styles.paymentText, { color: p.textColor }]}>{p.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {sale.distanceMiles > 0 && (
              <Text style={styles.distance}>{sale.distanceMiles} mi</Text>
            )}
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
    backgroundColor: colors.cardBackground,
    borderRadius: radii.card,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  headerImage: {
    width: '100%',
    height: 180,
  },
  noImage: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontFamily: fonts.uiSans,
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
  },
  matchText: {
    color: colors.white,
    fontSize: fontSize.uiMicro,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  saveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIcon: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  saveIconActive: {
    color: colors.accentPrimary,
  },
  content: {
    padding: spacing.listItemVertical,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  company: {
    fontSize: fontSize.uiButton,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.uiButton,
    fontFamily: fonts.bodySerif,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  paymentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.small,
  },
  paymentText: {
    fontSize: fontSize.uiMicro,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distance: {
    fontSize: fontSize.uiCaption,
    color: colors.textPrimary,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.small,
  },
  statusText: {
    fontSize: fontSize.uiMicro,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  dates: {
    fontSize: fontSize.uiCaption,
    color: colors.textSecondary,
    fontFamily: fonts.uiSans,
  },
});
