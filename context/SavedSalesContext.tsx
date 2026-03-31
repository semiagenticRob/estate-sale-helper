import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedSale } from '../types';

const STORAGE_KEY = 'estate_helper_saved_sales';

interface SavedSalesContextValue {
  savedSales: SavedSale[];
  toggleSave: (saleId: string) => Promise<void>;
  isSaved: (saleId: string) => boolean;
  reload: () => Promise<void>;
}

const SavedSalesContext = createContext<SavedSalesContextValue | null>(null);

export function SavedSalesProvider({ children }: { children: React.ReactNode }) {
  const [savedSales, setSavedSales] = useState<SavedSale[]>([]);

  const reload = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setSavedSales(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // AsyncStorage or JSON.parse failed — not critical, keep current state
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleSave = useCallback(
    async (saleId: string) => {
      const existing = savedSales.find((s) => s.saleId === saleId);
      const updated = existing
        ? savedSales.filter((s) => s.saleId !== saleId)
        : [...savedSales, { saleId, savedAt: new Date().toISOString() }];

      setSavedSales(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Persist failed — UI state is already updated; storage error is non-critical
      }
    },
    [savedSales]
  );

  const isSaved = useCallback(
    (saleId: string) => savedSales.some((s) => s.saleId === saleId),
    [savedSales]
  );

  return (
    <SavedSalesContext.Provider value={{ savedSales, toggleSave, isSaved, reload }}>
      {children}
    </SavedSalesContext.Provider>
  );
}

export function useSavedSalesContext(): SavedSalesContextValue {
  const ctx = useContext(SavedSalesContext);
  if (!ctx) throw new Error('useSavedSalesContext must be used within SavedSalesProvider');
  return ctx;
}
