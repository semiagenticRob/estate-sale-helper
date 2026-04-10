import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing, radii } from '../lib/theme';
import { ReviewAggregate } from '../types';

const MIN_REVIEWS = 3;

interface Props {
  aggregate: ReviewAggregate | null;
  loading: boolean;
  canReview: boolean;
  onLeaveReview: () => void;
}

const DIMENSIONS: { key: keyof Pick<ReviewAggregate, 'pricingPos' | 'qualityPos' | 'accuracyPos' | 'availabilityPos'>; totalKey: keyof Pick<ReviewAggregate, 'pricingTotal' | 'qualityTotal' | 'accuracyTotal' | 'availabilityTotal'>; label: string }[] = [
  { key: 'pricingPos', totalKey: 'pricingTotal', label: 'Fair Pricing' },
  { key: 'qualityPos', totalKey: 'qualityTotal', label: 'Good Quality' },
  { key: 'accuracyPos', totalKey: 'accuracyTotal', label: 'Accurate Listing' },
  { key: 'availabilityPos', totalKey: 'availabilityTotal', label: 'Still Plenty Left' },
];

export function ReviewAggregateCard({ aggregate, loading, canReview, onLeaveReview }: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Community Reviews</Text>
        <View style={styles.skeleton} />
        <View style={[styles.skeleton, { width: '60%' }]} />
      </View>
    );
  }

  const hasEnough = aggregate && aggregate.pricingTotal >= MIN_REVIEWS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Reviews</Text>

      <View style={styles.dimensions}>
        {DIMENSIONS.map((dim) => {
          const pos = hasEnough ? aggregate![dim.key] : 0;
          const total = hasEnough ? aggregate![dim.totalKey] : 0;
          const pct = total > 0 ? Math.round((pos / total) * 100) : 0;
          return (
            <View key={dim.key} style={[styles.dimRow, !hasEnough && styles.dimRowMuted]}>
              <Text style={[styles.dimLabel, !hasEnough && styles.dimLabelMuted]}>{dim.label}</Text>
              <View style={[styles.barTrack, !hasEnough && styles.barTrackMuted]}>
                {hasEnough && <View style={[styles.barFill, { width: `${pct}%` }]} />}
              </View>
              <Text style={[styles.pct, !hasEnough && styles.pctMuted]}>
                {hasEnough ? `${pct}%` : '—'}
              </Text>
            </View>
          );
        })}
        <Text style={styles.reviewCount}>
          {!aggregate || aggregate.pricingTotal === 0
            ? 'No reviews yet — be the first!'
            : hasEnough
              ? `Based on ${aggregate.pricingTotal} review${aggregate.pricingTotal > 1 ? 's' : ''}`
              : `${aggregate.pricingTotal} review${aggregate.pricingTotal > 1 ? 's' : ''} so far — need ${MIN_REVIEWS} for results`}
        </Text>
      </View>

      {canReview && (
        <Pressable style={styles.reviewBtn} onPress={onLeaveReview}>
          <Text style={styles.reviewBtnText}>Leave a Quick Review</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.displaySmall,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  skeleton: {
    height: 14,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.small,
    marginBottom: spacing.sm,
  },
  dimensions: {
    gap: spacing.md,
  },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dimRowMuted: {
    opacity: 0.4,
  },
  dimLabel: {
    width: 110,
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSans,
    color: colors.textPrimary,
  },
  dimLabelMuted: {
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barTrackMuted: {
    backgroundColor: colors.backgroundSecondary,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.statusActive,
    borderRadius: 4,
  },
  pct: {
    width: 36,
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  pctMuted: {
    color: colors.textSecondary,
  },
  reviewCount: {
    fontSize: fontSize.uiMicro,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reviewBtn: {
    marginTop: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.accentPrimary,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: {
    fontSize: fontSize.uiButton,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
});
