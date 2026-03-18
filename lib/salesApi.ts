import { supabase } from './supabase';
import { Sale, SearchResult, DateRange } from '../types';
import { getDistanceMiles } from './location';
import { getDateBounds } from './dates';

/** Format a Date as YYYY-MM-DD string for Supabase queries. */
function formatDateParam(d: Date): string {
  return d.toISOString().split('T')[0];
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
  sale_hours: string | null;
  url: string | null;
  distance_miles: number | null;
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
  const bounds = getDateBounds(dateRange);
  const startDate = formatDateParam(bounds.startDate);
  const endDate = formatDateParam(bounds.endDate);

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
    saleHours: row.sale_hours ?? undefined,
    url: row.url ?? undefined,
    images: row.header_image_url
      ? [{ id: `${row.id}-img`, imageUrl: row.header_image_url, position: 0 }]
      : [],
    distanceMiles: row.distance_miles != null ? Math.round(row.distance_miles * 10) / 10 : 0,
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

export function toStateAbbrev(stateLabel: string): string {
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
  sale_hours: string | null;
  url: string | null;
}

/**
 * Sanitize a user-provided string for use inside a PostgREST filter value.
 * PostgREST uses `.` (column.operator), `,` (filter separator), and `()`
 * (grouping) as syntax — these must be stripped from user input to prevent
 * filter injection.
 */
export function sanitizeFilterValue(input: string): string {
  return input.replace(/[,.()"\\]/g, '').trim();
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
    .select('id, external_id, title, company_name, address, city, state, zip_code, latitude, longitude, start_date, end_date, description, terms, sale_hours, url')
    .eq('state', abbrev)
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .order('start_date');

  const sanitized = sanitizeFilterValue(query);
  if (sanitized) {
    builder = builder.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
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
      ? getDistanceMiles(latitude, longitude, row.latitude!, row.longitude!)
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
      saleHours: row.sale_hours ?? undefined,
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
    saleHours: sale.sale_hours ?? undefined,
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
