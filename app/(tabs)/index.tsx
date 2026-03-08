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
import { setLastSearch } from '../../lib/searchState';

export default function HomeScreen() {
  const router = useRouter();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [distance, setDistance] = useState(25);
  const [dateRange, setDateRange] = useState<DateRange>('thisweek');

  const handleSearch = () => {
    const params = {
      query,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: distance.toString(),
      dateRange,
    };
    setLastSearch(params);
    router.push({ pathname: '/results', params });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Location */}
      <View style={styles.locationContainer}>
        {location.loading ? (
          <ActivityIndicator size="small" color="#3A3830" />
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
    backgroundColor: '#FAF7F2',
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
    color: '#3A3830',
    fontWeight: '600',
  },
  locationError: {
    fontSize: 12,
    color: '#8B5E30',
    marginTop: -16,
    marginBottom: 16,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1A16',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DDD8CE',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1C1A16',
  },
  searchButton: {
    backgroundColor: '#3A3830',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#FAF7F2',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#A8A09A',
    marginTop: 12,
  },
});
