import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DateRange } from '../types';

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'next3days', label: 'Next 3 Days' },
  { value: 'thisweek', label: 'This Week' },
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
    color: '#555',
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
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionSelected: {
    backgroundColor: '#1a5f2a',
    borderColor: '#1a5f2a',
  },
  optionText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
});
