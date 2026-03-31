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
        let servicesEnabled = false;
        try {
          servicesEnabled = await Location.hasServicesEnabledAsync();
        } catch {
          // Native location service check failed — treat as disabled
        }

        if (!servicesEnabled) {
          if (!cancelled) {
            setState({ ...DEFAULT_LOCATION, loading: false, error: 'Location services disabled' });
          }
          return;
        }

        let status: string = 'denied';
        try {
          const result = await Location.requestForegroundPermissionsAsync();
          status = result.status;
        } catch {
          // Permission request threw — treat as denied
        }

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

        let position: Location.LocationObject | null = null;
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch {
          // GPS unavailable — fall back to default
        }

        if (!position) {
          if (!cancelled) {
            setState({ ...DEFAULT_LOCATION, loading: false, error: 'Could not determine location' });
          }
          return;
        }

        let city = DEFAULT_LOCATION.city;
        try {
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (geocode) {
            city = [geocode.city || geocode.subregion, geocode.region].filter(Boolean).join(', ') || DEFAULT_LOCATION.city;
          }
        } catch {
          // Reverse geocode failed — use coordinates with default city label
        }

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
