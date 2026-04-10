export interface Sale {
  id: string;
  externalId?: string;
  title: string;
  companyName?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  startDate: string; // ISO date string
  endDate: string;
  description: string;
  terms?: string;
  saleHours?: string;
  url?: string;
  images: SaleImage[];
}

export interface SaleImage {
  id: string;
  imageUrl: string;
  caption?: string;
  aiTags?: string[];
  position: number;
}

export interface SearchQuery {
  query: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  dateRange: DateRange;
}

export type DateRange = 'today' | 'tomorrow' | 'thisweekend' | 'thisweek' | 'all';

export interface SearchResult extends Sale {
  distanceMiles: number;
  matchPercent: number;
  headerImageUrl?: string;
}

export interface SavedSale {
  saleId: string;
  savedAt: string;
  remindAt?: string;
}

// ─── Community: Signals & Reviews ─────────────────────────────────

export type SignalType = 'worth_it' | 'skip_it';

export interface SaleScore {
  saleId: string;
  worthItCount: number;
  skipItCount: number;
  heatScore: number; // 0-1, worth_it / (worth_it + skip_it) with decay
}

export interface ReviewAggregate {
  saleId: string;
  pricingPos: number;
  pricingTotal: number;
  qualityPos: number;
  qualityTotal: number;
  accuracyPos: number;
  accuracyTotal: number;
  availabilityPos: number;
  availabilityTotal: number;
}
