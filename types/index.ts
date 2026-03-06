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

export type DateRange = 'today' | 'tomorrow' | 'next3days' | 'thisweek';

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
