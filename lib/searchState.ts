import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LastSearch {
  query: string;
  latitude: string;
  longitude: string;
  radius: string;
  dateRange: string;
  [key: string]: string;
}

let lastSearch: LastSearch | null = null;

export function setLastSearch(params: LastSearch) {
  lastSearch = params;
}

export function getLastSearch(): LastSearch | null {
  return lastSearch;
}

const COORDS_LAT_KEY = '@estate_helper_last_lat';
const COORDS_LNG_KEY = '@estate_helper_last_lng';

export async function saveLastCoords(lat: number, lng: number): Promise<void> {
  await AsyncStorage.multiSet([
    [COORDS_LAT_KEY, lat.toString()],
    [COORDS_LNG_KEY, lng.toString()],
  ]);
}

export async function getLastCoords(): Promise<{ lat: number; lng: number } | null> {
  const [[, latStr], [, lngStr]] = await AsyncStorage.multiGet([COORDS_LAT_KEY, COORDS_LNG_KEY]);
  if (latStr && lngStr) {
    return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
  }
  return null;
}
