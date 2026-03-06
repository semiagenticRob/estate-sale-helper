import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedSale } from '../types';

const STORAGE_KEY = 'estate_helper_saved_sales';

export function useSavedSales() {
  const [savedSales, setSavedSales] = useState<SavedSale[]>([]);

  useEffect(() => {
    loadSavedSales();
  }, []);

  const loadSavedSales = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedSales(JSON.parse(data));
      }
    } catch {
      // Silently fail — saved sales are not critical
    }
  };

  const toggleSave = useCallback(
    async (saleId: string) => {
      const existing = savedSales.find((s) => s.saleId === saleId);
      let updated: SavedSale[];

      if (existing) {
        updated = savedSales.filter((s) => s.saleId !== saleId);
      } else {
        updated = [
          ...savedSales,
          { saleId, savedAt: new Date().toISOString() },
        ];
      }

      setSavedSales(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [savedSales]
  );

  const isSaved = useCallback(
    (saleId: string) => savedSales.some((s) => s.saleId === saleId),
    [savedSales]
  );

  return { savedSales, toggleSave, isSaved, reload: loadSavedSales };
}
