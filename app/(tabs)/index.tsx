import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { setLastSearch, saveLastCoords } from '../../lib/searchState';
import { colors, fonts, fontSize, spacing, radii } from '../../lib/theme';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type ScreenMode = 'loading' | 'onboarding' | 'search';

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ScreenMode>('loading');
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  // Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        // Permission already granted — auto-navigate handled by _layout
        // Show search as fallback in case layout redirect doesn't fire
        setMode('search');
      } else if (status === 'denied') {
        setDenied(true);
        setMode('search');
      } else {
        setMode('onboarding');
      }
    } catch {
      setMode('search');
    }
  }

  async function handleShareLocation() {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = position.coords;
        await saveLastCoords(latitude, longitude);

        const params = {
          query: '',
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: '100',
          dateRange: 'today',
          viewMode: 'map',
        };
        setLastSearch(params);
        router.replace({ pathname: '/results', params });
      } else {
        setDenied(true);
        setMode('search');
      }
    } catch {
      setMode('search');
    } finally {
      setRequesting(false);
    }
  }

  // Nominatim search
  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) { setSuggestions([]); return; }
    setFetching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=us`,
        { headers: { 'User-Agent': 'EstateSaleHelper/1.0' } }
      );
      setSuggestions(await res.json());
    } catch { setSuggestions([]); }
    finally { setFetching(false); }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(text), 400);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: NominatimResult) => {
    setSuggestions([]);
    Keyboard.dismiss();
    navigateToMap(parseFloat(item.lat), parseFloat(item.lon));
  };

  const handleSearch = async () => {
    if (!query.trim()) { setSearchError('Enter a city or zip code'); return; }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=1&countrycodes=us`,
        { headers: { 'User-Agent': 'EstateSaleHelper/1.0' } }
      );
      const data: NominatimResult[] = await res.json();
      if (!data || data.length === 0) {
        setSearchError('Location not found. Try a different city or zip code.');
        return;
      }
      navigateToMap(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch {
      setSearchError('Could not search. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  function navigateToMap(lat: number, lng: number) {
    const params = {
      query: '',
      latitude: lat.toString(),
      longitude: lng.toString(),
      radius: '100',
      dateRange: 'today',
      viewMode: 'map',
    };
    setLastSearch(params);
    router.push({ pathname: '/results', params });
  }

  // ─── Loading ───────────────────────────────────────────────
  if (mode === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  // ─── Onboarding (first launch) ─────────────────────────────
  if (mode === 'onboarding') {
    return (
      <View style={styles.onboarding}>
        <Image
          source={require('../../assets/dodo-mascot.png')}
          style={styles.grandmaImage}
          contentFit="contain"
        />
        <Text style={styles.onboardTitle}>Find quality estate sales near you</Text>
        <Text style={styles.onboardSubtitle}>
          Share your location to discover sales nearby and help other attendees with reviews
        </Text>
        <Pressable
          style={styles.shareBtn}
          onPress={handleShareLocation}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.shareBtnText}>Share Location</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setMode('search')} style={styles.skipLink}>
          <Text style={styles.skipText}>Search by city instead</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Search (minimal, also fallback for denied) ────────────
  return (
    <View style={styles.searchContainer}>
      {denied && (
        <View style={styles.deniedBanner}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.deniedText}>
            Enable location to help other attendees with reviews
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS === 'ios') Linking.openURL('app-settings:');
              else Linking.openSettings();
            }}
          >
            <Text style={styles.deniedLink}>Settings</Text>
          </Pressable>
        </View>
      )}

      <Image
        source={require('../../assets/dodo-mascot.png')}
        style={styles.searchImage}
        contentFit="contain"
      />

      <Text style={styles.searchTitle}>Find Estate Sales</Text>

      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="City name or Zip code"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCorrect={false}
        />
        {fetching && <ActivityIndicator size="small" color={colors.textSecondary} />}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((item, i) => (
            <Pressable
              key={item.place_id}
              style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionBorder]}
              onPress={() => handleSelectSuggestion(item)}
            >
              <Text style={styles.suggestionText} numberOfLines={1}>
                {item.display_name.split(', ').slice(0, 3).join(', ')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {searchError && <Text style={styles.errorText}>{searchError}</Text>}

      <Pressable
        style={[styles.searchBtn, searching && { opacity: 0.7 }]}
        onPress={handleSearch}
        disabled={searching}
      >
        {searching ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.searchBtnText}>Search</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
  },

  // Onboarding
  onboarding: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  grandmaImage: {
    width: 200,
    height: 300,
    marginBottom: spacing.xl,
  },
  onboardTitle: {
    fontSize: fontSize.displayMedium,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  onboardSubtitle: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  shareBtn: {
    backgroundColor: colors.accentPrimary,
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shareBtnText: {
    color: colors.white,
    fontSize: fontSize.uiButton,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
  },
  skipLink: {
    marginTop: spacing.base,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.uiCaption,
    fontFamily: fonts.uiSans,
    color: colors.accentPrimary,
  },

  // Search
  searchContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  deniedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.small,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  deniedText: {
    flex: 1,
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSans,
    color: colors.textSecondary,
  },
  deniedLink: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  searchImage: {
    width: 120,
    height: 180,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  searchTitle: {
    fontSize: fontSize.displayMedium,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    height: 52,
    marginBottom: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.body,
    fontFamily: fonts.uiSans,
    color: colors.textPrimary,
  },
  suggestionsBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  suggestionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  suggestionText: {
    fontSize: fontSize.bodySmall,
    fontFamily: fonts.uiSans,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: fontSize.uiLabel,
    fontFamily: fonts.uiSans,
    color: colors.destructive,
    marginBottom: spacing.sm,
  },
  searchBtn: {
    backgroundColor: colors.accentPrimary,
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: colors.white,
    fontSize: fontSize.uiButton,
    fontFamily: fonts.uiSansMedium,
    fontWeight: '600',
  },
});
