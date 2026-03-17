import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DateRange } from '../types';
import { colors, fonts, fontSize, spacing, radii } from '../lib/theme';

const DATE_OPTIONS: { value: DateRange; label: string; span2?: boolean }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'thisweekend', label: 'This Weekend' },
  { value: 'thisweek', label: 'This Week' },
  { value: 'all', label: 'All Upcoming', span2: true },
];

export const DATE_RANGE_DISPLAY: Record<DateRange, string> = {
  today: 'today',
  tomorrow: 'tomorrow',
  thisweekend: 'this weekend',
  thisweek: 'this week',
  all: 'all upcoming',
};

interface DateFilterProps {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
}

export function DateFilter({ selected, onSelect }: DateFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>WHEN?</Text>
      <View style={styles.grid}>
        {DATE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              option.span2 && styles.optionSpan2,
              selected === option.value && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                selected === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '700',
    color: '#3B2A1A',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    width: '48.5%',
    paddingVertical: 10,
    borderRadius: radii.small,
    backgroundColor: colors.cardBackground,
    borderWidth: 0.5,
    borderColor: '#C4A882',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSpan2: {
    width: '100%',
  },
  optionSelected: {
    backgroundColor: '#7A5C3F',
    borderColor: '#7A5C3F',
  },
  optionText: {
    fontSize: 14,
    color: '#5C4A38',
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
  },
});
