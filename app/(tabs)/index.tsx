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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../hooks/useLocation';
import { DateFilter, DATE_RANGE_DISPLAY } from '../../components/DateFilter';
import { DateRange } from '../../types';
import { setLastSearch } from '../../lib/searchState';
import { colors, fonts, fontSize, spacing, radii } from '../../lib/theme';

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
  const [dateRange, setDateRange] = useState<DateRange>('thisweekend');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const hasPopulated = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        { headers: { 'User-Agent': 'EstateSaleHelper/1.0' } }
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
    setIsEditingLocation(false);
    Keyboard.dismiss();
  };

  const handleSearch = async () => {
    setLocationError(null);
    setSuggestions([]);

    const isStatewide = !locationQuery.trim();

    let lat: number;
    let lng: number;
    let searchRadius: number;
    let stateLabel = '';

    if (isStatewide) {
      if (resolvedCoords) {
        lat = resolvedCoords.lat;
        lng = resolvedCoords.lng;
      } else if (!location.loading && !location.error) {
        lat = location.latitude;
        lng = location.longitude;
      } else {
        lat = location.latitude;
        lng = location.longitude;
      }
      searchRadius = 500;
      const parts = location.city.split(',').map((s) => s.trim());
      stateLabel = parts.length > 1 ? parts[parts.length - 1] : '';
    } else if (resolvedCoords) {
      lat = resolvedCoords.lat;
      lng = resolvedCoords.lng;
      searchRadius = 100;
    } else {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery.trim())}&format=json&limit=1&countrycodes=us`,
          { headers: { 'User-Agent': 'EstateSaleHelper/1.0' } }
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
      searchRadius = 100;
    }

    const params = {
      query: '',
      latitude: lat.toString(),
      longitude: lng.toString(),
      radius: searchRadius.toString(),
      dateRange,
      ...(isStatewide && stateLabel ? { statewide: stateLabel } : {}),
    };
    setLastSearch(params);
    router.push({ pathname: '/results', params });
  };

  const buttonLabel = `Show sales ${DATE_RANGE_DISPLAY[dateRange]}`;

  return (
    <View style={styles.wrapper}>
      {/* Mascot overlapping header */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../../assets/dodo-mascot.png')}
          style={styles.mascotImage}
          resizeMode="cover"
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {/* Location Row */}
      <View style={styles.locationSection}>
        <Text style={styles.sectionLabel}>WHERE?</Text>
        {isEditingLocation ? (
          <>
            <View style={styles.locationInputRow}>
              <TextInput
                style={styles.locationInput}
                placeholder="City, state or zip code"
                placeholderTextColor={colors.placeholder}
                value={locationQuery}
                onChangeText={handleLocationChange}
                autoFocus
                returnKeyType="done"
                autoCorrect={false}
                onBlur={() => {
                  if (locationQuery.trim()) setIsEditingLocation(false);
                }}
              />
              {isFetchingSuggestions && (
                <ActivityIndicator size="small" color={colors.textSecondary} />
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
          </>
        ) : (
          <Pressable style={styles.locationDisplay} onPress={() => setIsEditingLocation(true)}>
            {location.loading ? (
              <ActivityIndicator size="small" color={colors.accentPrimary} />
            ) : (
              <>
                <Ionicons name="location-sharp" size={14} color={colors.buttonSelected} />
                <Text style={styles.locationText}>
                  {locationQuery || 'Tap to set location'}
                </Text>
                <Text style={styles.locationHint}>{'\u00B7'} tap to change</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Date Filter */}
      <DateFilter selected={dateRange} onSelect={setDateRange} />

      {/* Search Button */}
      <Pressable style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>{buttonLabel}</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

const MASCOT_SIZE = 72;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  mascotContainer: {
    position: 'absolute',
    top: -MASCOT_SIZE / 2,
    left: spacing.lg,
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.borderGold,
    overflow: 'hidden',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: MASCOT_SIZE - 4,
    height: MASCOT_SIZE - 4,
    borderRadius: (MASCOT_SIZE - 4) / 2,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: MASCOT_SIZE / 2 + 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  locationSection: {
    marginBottom: 28,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
    color: colors.textDark,
  },
  locationHint: {
    fontSize: 13,
    fontFamily: fonts.uiSans,
    color: colors.buttonSelected,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    borderRadius: radii.small,
    paddingHorizontal: 12,
    height: 44,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    fontFamily: fonts.uiSans,
  },
  suggestionsContainer: {
    backgroundColor: colors.cardBackground,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    borderRadius: radii.small,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderGold,
  },
  suggestionText: {
    fontSize: 15,
    color: colors.textDark,
    fontFamily: fonts.uiSans,
  },
  locationError: {
    fontSize: fontSize.uiLabel,
    color: colors.destructive,
    marginTop: spacing.sm,
  },
  searchButton: {
    backgroundColor: colors.buttonSelected,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
  },
});
