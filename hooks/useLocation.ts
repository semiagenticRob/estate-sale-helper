import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION } from '../lib/location';

interface LocationState {
  latitude: number;
  longitude: number;
  city: string;
  loading: boolean;
  error: string | null;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    ...DEFAULT_LOCATION,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Location permission denied. Using default location.',
          }));
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Reverse geocode to get city name
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const city = place
          ? `${place.city || place.subregion || 'Unknown'}, ${place.region || ''}`
          : 'Unknown location';

        setState({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city,
          loading: false,
          error: null,
        });
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Could not get location. Using default.',
        }));
      }
    })();
  }, []);

  return state;
}
