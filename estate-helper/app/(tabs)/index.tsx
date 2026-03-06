import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { DistanceSelector } from '../../components/DistanceSelector';
import { DateFilter } from '../../components/DateFilter';
import { DateRange } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [distance, setDistance] = useState(25);
  const [dateRange, setDateRange] = useState<DateRange>('thisweek');

  const handleSearch = () => {
    router.push({
      pathname: '/results',
      params: {
        query,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        radius: distance.toString(),
        dateRange,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Location */}
      <View style={styles.locationContainer}>
        {location.loading ? (
          <ActivityIndicator size="small" color="#1a5f2a" />
        ) : (
          <>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{location.city}</Text>
          </>
        )}
      </View>

      {location.error && (
        <Text style={styles.locationError}>{location.error}</Text>
      )}

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>What are you looking for?</Text>
        <TextInput
          style={styles.searchInput}
          placeholder='e.g. "vintage furniture", "vinyl records", "jewelry"'
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>

      {/* Distance Selector */}
      <DistanceSelector selected={distance} onSelect={setDistance} />

      {/* Date Filter */}
      <DateFilter selected={dateRange} onSelect={setDateRange} />

      {/* Search Button */}
      <Pressable style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Find Estate Sales</Text>
      </Pressable>

      {/* Hint */}
      <Text style={styles.hint}>
        Leave the search empty to see all nearby sales
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  locationError: {
    fontSize: 12,
    color: '#e65100',
    marginTop: -16,
    marginBottom: 16,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#1a5f2a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginTop: 12,
  },
});
