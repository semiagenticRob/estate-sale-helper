import AsyncStorage from '@react-native-async-storage/async-storage';

const VISIT_KEY = '@estate_helper_active_visit';
const REVIEWED_KEY = '@estate_helper_reviewed_sales';

export interface GeofenceVisit {
  saleId: string;
  saleTitle: string;
  saleLat: number;
  saleLng: number;
  enteredAt: string; // ISO timestamp
}

export async function saveVisit(
  saleId: string,
  saleTitle: string,
  saleLat: number,
  saleLng: number,
): Promise<void> {
  const visit: GeofenceVisit = {
    saleId,
    saleTitle,
    saleLat,
    saleLng,
    enteredAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(VISIT_KEY, JSON.stringify(visit));
}

export async function getActiveVisit(): Promise<GeofenceVisit | null> {
  const raw = await AsyncStorage.getItem(VISIT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeofenceVisit;
  } catch {
    return null;
  }
}

export async function clearVisit(): Promise<void> {
  await AsyncStorage.removeItem(VISIT_KEY);
}

export async function markReviewed(saleId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(REVIEWED_KEY);
  let reviewed: any[] = [];
  try {
    reviewed = raw ? JSON.parse(raw) : [];
  } catch {
    reviewed = [];
  }
  const today = new Date().toISOString().slice(0, 10);
  const entry = { saleId, date: today };
  const alreadyExists = reviewed.some((r: any) =>
    typeof r === 'object' ? r.saleId === saleId && r.date === today : false
  );
  if (!alreadyExists) {
    reviewed.push(entry);
    // Keep only last 50 to avoid unbounded growth
    if (reviewed.length > 50) reviewed = reviewed.slice(-50);
    await AsyncStorage.setItem(REVIEWED_KEY, JSON.stringify(reviewed));
  }
  // Also clear active visit if it matches
  const visit = await getActiveVisit();
  if (visit?.saleId === saleId) {
    await clearVisit();
  }
}

export async function hasReviewed(saleId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(REVIEWED_KEY);
  if (!raw) return false;
  try {
    const reviewed: any[] = JSON.parse(raw);
    // Migrate: if any entries are plain strings (old format), wipe and start fresh
    if (reviewed.length > 0 && typeof reviewed[0] === 'string') {
      await AsyncStorage.removeItem(REVIEWED_KEY);
      return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    return reviewed.some((r: any) =>
      typeof r === 'object' && r.saleId === saleId && r.date === today
    );
  } catch {
    return false;
  }
}
