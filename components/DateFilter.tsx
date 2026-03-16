import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DateRange } from '../types';

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'next3days', label: 'Next 3 Days' },
  { value: 'thisweek', label: 'This Week' },
  { value: 'all', label: 'All Dates' },
];

interface DateFilterProps {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
}

export function DateFilter({ selected, onSelect }: DateFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>When</Text>
      <View style={styles.options}>
        {DATE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A7269',
    marginBottom: 8,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DDD8CE',
  },
  optionSelected: {
    backgroundColor: '#3A3830',
    borderColor: '#3A3830',
  },
  optionText: {
    fontSize: 14,
    color: '#5A5550',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FAF7F2',
  },
});
