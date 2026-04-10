import { useState, useEffect, useCallback } from 'react';
import { submitSignal, getUserSignal } from '../lib/communityApi';
import { SignalType } from '../types';

type SignalState = 'idle' | 'submitting' | 'submitted' | 'error';

interface UseSignalReturn {
  state: SignalState;
  currentSignal: SignalType | null;
  submit: (type: SignalType, lat: number, lng: number) => Promise<void>;
  error: string | null;
}

export function useSignal(saleId: string | undefined): UseSignalReturn {
  const [state, setState] = useState<SignalState>('idle');
  const [currentSignal, setCurrentSignal] = useState<SignalType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) return;
    let cancelled = false;

    getUserSignal(saleId).then((existing) => {
      if (!cancelled && existing) {
        setCurrentSignal(existing);
        setState('submitted');
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [saleId]);

  const submit = useCallback(async (type: SignalType, lat: number, lng: number) => {
    if (!saleId) return;
    setState('submitting');
    setError(null);

    try {
      const result = await submitSignal(saleId, type, lat, lng);
      if (!result.ok) {
        setState('error');
        setError(result.error === 'outside_geofence'
          ? 'You need to be at the sale to submit'
          : result.error ?? 'Something went wrong');
        return;
      }
      setCurrentSignal(type);
      setState('submitted');
    } catch (e: any) {
      setState('error');
      setError(e.message ?? 'Something went wrong');
    }
  }, [saleId]);

  return { state, currentSignal, submit, error };
}
