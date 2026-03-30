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
    let cancelled = false;

    async function getLocation() {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (!cancelled) {
            setState({ ...DEFAULT_LOCATION, loading: false, error: 'Location services disabled' });
          }
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setState({
              ...DEFAULT_LOCATION,
              loading: false,
              error: 'Location permission denied',
            });
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const city = geocode
          ? [geocode.city || geocode.subregion, geocode.region].filter(Boolean).join(', ')
          : DEFAULT_LOCATION.city;

        if (!cancelled) {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city,
            loading: false,
            error: null,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            ...DEFAULT_LOCATION,
            loading: false,
            error: 'Could not determine location',
          });
        }
      }
    }

    getLocation();
    return () => { cancelled = true; };
  }, []);

  return state;
}
