import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../lib/theme';

function LegendChip({ label, bgColor, textColor }: { label: string; bgColor: string; textColor: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function HeatLegend() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Ratings</Text>
      <View style={styles.row}>
        <LegendChip label="Hot" bgColor={colors.heatHot} textColor="#fff" />
        <LegendChip label="Warm" bgColor={colors.heatWarm} textColor="#fff" />
        <LegendChip label="Mixed" bgColor={colors.heatCool} textColor="#fff" />
        <LegendChip label="Skip" bgColor={colors.heatCold} textColor="#fff" />
        <LegendChip label="New" bgColor={colors.accentPrimary} textColor="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  title: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
  },
});
