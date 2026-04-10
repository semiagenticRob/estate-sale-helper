import { supabase } from './supabase';
import { getHashedDeviceId } from './deviceId';
import { SaleScore, ReviewAggregate } from '../types';

interface SignalResponse {
  ok: boolean;
  error?: string;
  signal_type?: string;
  heat_score?: number;
  worth_it_count?: number;
  skip_it_count?: number;
  distance_miles?: number;
}

interface ReviewResponse {
  ok: boolean;
  error?: string;
  pricing_pct?: number;
  quality_pct?: number;
  accuracy_pct?: number;
  availability_pct?: number;
  total_reviews?: number;
}

export async function submitSignal(
  saleId: string,
  signalType: 'worth_it' | 'skip_it',
  lat: number,
  lng: number,
): Promise<SignalResponse> {
  const deviceId = await getHashedDeviceId();
  const { data, error } = await supabase.rpc('submit_signal', {
    p_sale_id: saleId,
    p_device_id: deviceId,
    p_signal_type: signalType,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) throw new Error(error.message);
  return data as SignalResponse;
}

export async function submitReview(
  saleId: string,
  lat: number,
  lng: number,
  pricing: boolean,
  quality: boolean,
  accuracy: boolean,
  availability: boolean,
): Promise<ReviewResponse> {
  const deviceId = await getHashedDeviceId();
  const { data, error } = await supabase.rpc('submit_review', {
    p_sale_id: saleId,
    p_device_id: deviceId,
    p_lat: lat,
    p_lng: lng,
    p_pricing: pricing,
    p_quality: quality,
    p_accuracy: accuracy,
    p_availability: availability,
  });
  if (error) throw new Error(error.message);
  return data as ReviewResponse;
}

export async function getSaleScores(saleIds: string[]): Promise<Map<string, SaleScore>> {
  const { data, error } = await supabase.rpc('get_sale_scores', {
    p_sale_ids: saleIds,
  });
  const map = new Map<string, SaleScore>();
  if (error || !data) return map;
  for (const row of data as any[]) {
    map.set(row.sale_id, {
      saleId: row.sale_id,
      worthItCount: row.worth_it_count,
      skipItCount: row.skip_it_count,
      heatScore: row.heat_score,
    });
  }
  return map;
}

export async function getSaleScore(saleId: string): Promise<SaleScore | null> {
  const { data, error } = await supabase
    .from('sale_scores')
    .select('*')
    .eq('sale_id', saleId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    saleId: data.sale_id,
    worthItCount: data.worth_it_count,
    skipItCount: data.skip_it_count,
    heatScore: data.heat_score,
  };
}

export async function getReviewAggregate(saleId: string): Promise<ReviewAggregate | null> {
  const { data, error } = await supabase
    .from('review_aggregates')
    .select('*')
    .eq('sale_id', saleId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    saleId: data.sale_id,
    pricingPos: data.pricing_pos,
    pricingTotal: data.pricing_total,
    qualityPos: data.quality_pos,
    qualityTotal: data.quality_total,
    accuracyPos: data.accuracy_pos,
    accuracyTotal: data.accuracy_total,
    availabilityPos: data.availability_pos,
    availabilityTotal: data.availability_total,
  };
}

export async function getUserSignal(saleId: string): Promise<'worth_it' | 'skip_it' | null> {
  const deviceId = await getHashedDeviceId();
  const { data, error } = await supabase
    .from('signals')
    .select('signal_type')
    .eq('sale_id', saleId)
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error || !data) return null;
  return data.signal_type as 'worth_it' | 'skip_it';
}
