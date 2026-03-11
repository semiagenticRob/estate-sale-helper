import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { DistanceSelector } from '../../components/DistanceSelector';
import { DateFilter } from '../../components/DateFilter';
import { DateRange } from '../../types';
import { setLastSearch } from '../../lib/searchState';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

function getSuggestionLabel(r: NominatimResult): string {
  if (r.address) {
    const { city, town, village, county, state, postcode } = r.address;
    const place = city || town || village || county || '';
    if (postcode && place && state) return `${postcode}, ${place}, ${state}`;
    if (place && state) return `${place}, ${state}`;
  }
  return r.display_name.split(', ').slice(0, 2).join(', ');
}

export default function HomeScreen() {
  const router = useRouter();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [distance, setDistance] = useState(25);
  const [dateRange, setDateRange] = useState<DateRange>('thisweek');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const hasPopulated = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-populate with GPS city once on successful detection, storing coords
  useEffect(() => {
    if (!location.loading && !hasPopulated.current) {
      hasPopulated.current = true;
      if (!location.error) {
        setLocationQuery(location.city);
        setResolvedCoords({ lat: location.latitude, lng: location.longitude });
      }
    }
  }, [location.loading, location.error, location.city, location.latitude, location.longitude]);

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=us&addressdetails=1`,
        { headers: { 'User-Agent': 'EstateHelper/1.0' } }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleLocationChange = (text: string) => {
    setLocationQuery(text);
    setLocationError(null);
    setResolvedCoords(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(text), 400);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: NominatimResult) => {
    setLocationQuery(getSuggestionLabel(item));
    setResolvedCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleSearch = async () => {
    setLocationError(null);
    setSuggestions([]);

    if (!locationQuery.trim()) {
      setLocationError('Please enter a city, state, or zip code.');
      return;
    }

    let lat: number;
    let lng: number;

    if (resolvedCoords) {
      // Use coords from GPS pre-fill or selected suggestion
      lat = resolvedCoords.lat;
      lng = resolvedCoords.lng;
    } else {
      // Fallback: geocode via Nominatim directly
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery.trim())}&format=json&limit=1&countrycodes=us`,
          { headers: { 'User-Agent': 'EstateHelper/1.0' } }
        );
        const data: NominatimResult[] = await res.json();
        if (!data || data.length === 0) {
          setLocationError('Location not found. Try selecting a suggestion from the list.');
          return;
        }
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      } catch {
        setLocationError('Could not find that location. Please try again.');
        return;
      }
    }

    const params = {
      query,
      latitude: lat.toString(),
      longitude: lng.toString(),
      radius: distance.toString(),
      dateRange,
    };
    setLastSearch(params);
    router.push({ pathname: '/results', params });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Location Input */}
      <View style={styles.locationSection}>
        <Text style={styles.searchLabel}>Where are you looking?</Text>
        <View style={styles.locationInputRow}>
          {location.loading ? (
            <ActivityIndicator size="small" color="#3A3830" style={styles.locationSpinner} />
          ) : !location.error ? (
            <Text style={styles.locationPin}>📍</Text>
          ) : null}
          <TextInput
            style={[styles.locationInput, location.loading && styles.locationInputDisabled]}
            placeholder="City, state or zip code"
            placeholderTextColor="#aaa"
            value={locationQuery}
            onChangeText={handleLocationChange}
            editable={!location.loading}
            returnKeyType="next"
            autoCorrect={false}
          />
          {isFetchingSuggestions && (
            <ActivityIndicator size="small" color="#A8A09A" />
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((item, index) => (
              <Pressable
                key={item.place_id}
                style={[
                  styles.suggestionRow,
                  index < suggestions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => selectSuggestion(item)}
              >
                <Text style={styles.suggestionText}>{getSuggestionLabel(item)}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {locationError && <Text style={styles.locationError}>{locationError}</Text>}
      </View>

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
  locationSection: {
    marginBottom: 20,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DDD8CE',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  locationPin: {
    fontSize: 16,
    marginRight: 8,
  },
  locationSpinner: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1A16',
  },
  locationInputDisabled: {
    opacity: 0.5,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DDD8CE',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9E0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#1C1A16',
  },
  locationError: {
    fontSize: 12,
    color: '#8B5E30',
    marginTop: 6,
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
