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

  // TODO: Remove this override once done testing — forces Denver, CO
  useEffect(() => {
    setState({
      ...DEFAULT_LOCATION,
      loading: false,
      error: null,
    });
  }, []);

  return state;
}
