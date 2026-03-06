import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

interface DistanceSelectorProps {
  selected: number;
  onSelect: (miles: number) => void;
}

export function DistanceSelector({ selected, onSelect }: DistanceSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Distance</Text>
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
