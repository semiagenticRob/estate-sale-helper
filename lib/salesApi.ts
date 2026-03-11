import { supabase } from './supabase';
import { Sale, SearchResult, DateRange } from '../types';

function getDateBounds(range: DateRange): { startDate: string; endDate: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (range) {
    case 'today':
      return { startDate: fmt(today), endDate: fmt(today) };
    case 'tomorrow': {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return { startDate: fmt(today), endDate: fmt(d) };
    }
    case 'next3days': {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      return { startDate: fmt(today), endDate: fmt(d) };
    }
    case 'thisweek': {
      const d = new Date(today);
      d.setDate(d.getDate() + 6);
      return { startDate: fmt(today), endDate: fmt(d) };
    }
  }
}

interface SearchRow {
  id: string;
  external_id: string | null;
  title: string;
  company_name: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  description: string;
  url: string | null;
  distance_miles: number;
  match_percent: number;
  header_image_url: string | null;
}

interface ImageRow {
  id: string;
  image_url: string;
  caption: string | null;
  ai_tags: string[] | null;
  position: number;
}

export async function searchSales(params: {
  query: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  dateRange: DateRange;
}): Promise<SearchResult[]> {
  const { query, latitude, longitude, radiusMiles, dateRange } = params;
  const { startDate, endDate } = getDateBounds(dateRange);

  const { data, error } = await supabase.rpc('search_sales', {
    query: query.trim(),
    user_lat: latitude,
    user_lng: longitude,
    radius_miles: radiusMiles,
    date_start: startDate,
    date_end: endDate,
  });

  if (error) throw error;

  return (data as SearchRow[]).map((row) => ({
    id: row.id,
    externalId: row.external_id ?? undefined,
    title: row.title,
    companyName: row.company_name ?? undefined,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    latitude: row.latitude,
    longitude: row.longitude,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    url: row.url ?? undefined,
    images: row.header_image_url
      ? [{ id: `${row.id}-img`, imageUrl: row.header_image_url, position: 0 }]
      : [],
    distanceMiles: Math.round(row.distance_miles * 10) / 10,
    matchPercent: row.match_percent,
    headerImageUrl: row.header_image_url ?? undefined,
  }));
}

export async function getSaleById(id: string): Promise<Sale | null> {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();

  if (saleError || !sale) return null;

  const { data: images } = await supabase
    .from('sale_images')
    .select('*')
    .eq('sale_id', id)
    .order('position');

  return {
    id: sale.id,
    externalId: sale.external_id ?? undefined,
    title: sale.title,
    companyName: sale.company_name ?? undefined,
    address: sale.address,
    city: sale.city,
    state: sale.state,
    zipCode: sale.zip_code,
    latitude: sale.latitude,
    longitude: sale.longitude,
    startDate: sale.start_date,
    endDate: sale.end_date,
    description: sale.description,
    url: sale.url ?? undefined,
    images: (images as ImageRow[] ?? []).map((img) => ({
      id: img.id,
      imageUrl: img.image_url,
      caption: img.caption ?? undefined,
      aiTags: img.ai_tags ?? undefined,
      position: img.position,
    })),
  };
}
