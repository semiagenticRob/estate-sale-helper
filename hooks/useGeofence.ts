import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const GEOFENCE_RADIUS_MI = 0.5;

interface GeofenceState {
  withinRange: boolean;
  userLat: number;
  userLng: number;
  loading: boolean;
}

export function useGeofence(saleLat: number | undefined, saleLng: number | undefined): GeofenceState {
  const [state, setState] = useState<GeofenceState>({
    withinRange: false,
    userLat: 0,
    userLng: 0,
    loading: true,
  });

  useEffect(() => {
    if (saleLat == null || saleLng == null) {
      setState({ withinRange: false, userLat: 0, userLng: 0, loading: false });
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setState({ withinRange: false, userLat: 0, userLng: 0, loading: false });
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = position.coords;
        const dist = haversine(latitude, longitude, saleLat!, saleLng!);

        if (!cancelled) {
          setState({
            withinRange: dist <= GEOFENCE_RADIUS_MI,
            userLat: latitude,
            userLng: longitude,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState({ withinRange: false, userLat: 0, userLng: 0, loading: false });
      }
    }

    check();
    return () => { cancelled = true; };
  }, [saleLat, saleLng]);

  return state;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3959 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
