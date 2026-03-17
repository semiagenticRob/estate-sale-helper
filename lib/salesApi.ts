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
    case 'thisweekend': {
      // Find next Saturday and Sunday
      const day = today.getDay();
      const satOffset = day === 0 ? 6 : 6 - day;
      const sat = new Date(today);
      sat.setDate(sat.getDate() + satOffset);
      const sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      return { startDate: fmt(sat), endDate: fmt(sun) };
    }
    case 'thisweek': {
      const d = new Date(today);
      d.setDate(d.getDate() + 6);
      return { startDate: fmt(today), endDate: fmt(d) };
    }
    case 'all': {
      // Wide range: 1 year back to 1 year forward
      const past = new Date(today);
      past.setFullYear(past.getFullYear() - 1);
      const future = new Date(today);
      future.setFullYear(future.getFullYear() + 1);
      return { startDate: fmt(past), endDate: fmt(future) };
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
  terms: string | null;
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
  stateCode?: string;
}): Promise<SearchResult[]> {
  const { query, latitude, longitude, radiusMiles, dateRange, stateCode } = params;
  const { startDate, endDate } = getDateBounds(dateRange);

  // Statewide search: query by state column directly so sales without coords are included
  if (stateCode) {
    return searchByState({ query, stateCode, startDate, endDate, latitude, longitude });
  }

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
    terms: row.terms ?? undefined,
    url: row.url ?? undefined,
    images: row.header_image_url
      ? [{ id: `${row.id}-img`, imageUrl: row.header_image_url, position: 0 }]
      : [],
    distanceMiles: Math.round(row.distance_miles * 10) / 10,
    matchPercent: row.match_percent,
    headerImageUrl: row.header_image_url ?? undefined,
  }));
}

// State-level abbreviation mapping for common full names
const STATE_ABBREVS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
};

function toStateAbbrev(stateLabel: string): string {
  const lower = stateLabel.trim().toLowerCase();
  return STATE_ABBREVS[lower] || stateLabel.trim().toUpperCase();
}

interface StateSaleRow {
  id: string;
  external_id: string | null;
  title: string;
  company_name: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string;
  description: string;
  terms: string | null;
  url: string | null;
}

async function searchByState(params: {
  query: string;
  stateCode: string;
  startDate: string;
  endDate: string;
  latitude: number;
  longitude: number;
}): Promise<SearchResult[]> {
  const { query, stateCode, startDate, endDate, latitude, longitude } = params;
  const abbrev = toStateAbbrev(stateCode);

  let builder = supabase
    .from('sales')
    .select('id, external_id, title, company_name, address, city, state, zip_code, latitude, longitude, start_date, end_date, description, terms, url')
    .eq('state', abbrev)
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .order('start_date');

  if (query.trim()) {
    builder = builder.or(`title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`);
  }

  const { data, error } = await builder;
  if (error) throw error;

  const rows = data as StateSaleRow[];

  // Fetch header images for all sales in one query
  const saleIds = rows.map((r) => r.id);
  const { data: imageData } = await supabase
    .from('sale_images')
    .select('sale_id, image_url')
    .in('sale_id', saleIds)
    .eq('position', 0);

  const imageMap = new Map<string, string>();
  for (const img of (imageData || [])) {
    imageMap.set(img.sale_id, img.image_url);
  }

  return rows.map((row) => {
    const hasCoords = row.latitude != null && row.longitude != null;
    const dist = hasCoords
      ? haversine(latitude, longitude, row.latitude!, row.longitude!)
      : null;
    const headerImg = imageMap.get(row.id) || null;

    return {
      id: row.id,
      externalId: row.external_id ?? undefined,
      title: row.title,
      companyName: row.company_name ?? undefined,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      startDate: row.start_date,
      endDate: row.end_date,
      description: row.description,
      terms: row.terms ?? undefined,
      url: row.url ?? undefined,
      images: headerImg
        ? [{ id: `${row.id}-img`, imageUrl: headerImg, position: 0 }]
        : [],
      distanceMiles: dist != null ? Math.round(dist * 10) / 10 : 0,
      matchPercent: 0,
      headerImageUrl: headerImg ?? undefined,
    };
  });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    terms: sale.terms ?? undefined,
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
