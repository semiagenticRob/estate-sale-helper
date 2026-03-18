import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, fontSize, spacing, radii } from '../lib/theme';

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

interface DistanceSelectorProps {
  selected: number;
  onSelect: (miles: number) => void;
}

export function DistanceSelector({ selected, onSelect }: DistanceSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>HOW FAR?</Text>
      <View style={styles.options}>
        {DISTANCE_OPTIONS.map((miles) => (
          <Pressable
            key={miles}
            style={[styles.option, selected === miles && styles.optionSelected]}
            onPress={() => onSelect(miles)}
          >
            <Text
              style={[
                styles.optionText,
                selected === miles && styles.optionTextSelected,
              ]}
            >
              {miles} mi
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  options: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.small,
    backgroundColor: colors.cardBackground,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.buttonSelected,
    borderColor: colors.buttonSelected,
  },
  optionText: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
  },
});
