import { Sale, SearchResult, DateRange } from '../types';
import { getDistanceMiles } from './location';

// Client-side text matching for MVP (Phase 1)
// In Phase 2, this will be replaced by Supabase's Postgres full-text search
export function searchSales(
  sales: Sale[],
  query: string,
  userLat: number,
  userLng: number,
  radiusMiles: number,
  dateRange: DateRange
): SearchResult[] {
  const now = new Date();
  const { startDate, endDate } = getDateBounds(dateRange, now);
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return sales
    .map((sale) => {
      const distanceMiles = getDistanceMiles(
        userLat,
        userLng,
        sale.latitude,
        sale.longitude
      );

      const matchPercent =
        queryTerms.length === 0 ? 100 : calculateMatchPercent(sale, queryTerms);

      const headerImageUrl =
        sale.images.length > 0 ? sale.images[0].imageUrl : undefined;

      return {
        ...sale,
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        matchPercent,
        headerImageUrl,
      };
    })
    .filter((result) => {
      // Filter by distance
      if (result.distanceMiles > radiusMiles) return false;
      // Filter by date range
      const saleStart = new Date(result.startDate);
      const saleEnd = new Date(result.endDate);
      if (saleEnd < startDate || saleStart > endDate) return false;
      // Filter by match (must have some relevance if query provided)
      if (queryTerms.length > 0 && result.matchPercent === 0) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by match percent descending, then distance ascending
      if (b.matchPercent !== a.matchPercent)
        return b.matchPercent - a.matchPercent;
      return a.distanceMiles - b.distanceMiles;
    });
}

function calculateMatchPercent(sale: Sale, queryTerms: string[]): number {
  const searchText = `${sale.title} ${sale.description}`.toLowerCase();
  // Also check image captions
  const captionText = sale.images
    .map((img) => img.caption || '')
    .join(' ')
    .toLowerCase();
  const fullText = `${searchText} ${captionText}`;

  let matchedTerms = 0;
  let totalWeight = 0;

  for (const term of queryTerms) {
    // Count occurrences for weighted scoring
    const regex = new RegExp(term, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      matchedTerms++;
      // More occurrences = higher weight (diminishing returns)
      totalWeight += Math.min(matches.length, 5);
    }
  }

  if (matchedTerms === 0) return 0;

  // Base score: percentage of query terms found
  const termCoverage = matchedTerms / queryTerms.length;
  // Bonus for multiple occurrences (max 20% bonus)
  const occurrenceBonus = Math.min(0.2, (totalWeight - matchedTerms) * 0.05);

  return Math.round((termCoverage + occurrenceBonus) * 100);
}

function getDateBounds(
  range: DateRange,
  now: Date
): { startDate: Date; endDate: Date } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { startDate: today, endDate: tomorrow };
    }
    case 'thisweekend': {
      const day = today.getDay();
      const satOffset = day === 0 ? 6 : 6 - day;
      const sat = new Date(today);
      sat.setDate(sat.getDate() + satOffset);
      const sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      return { startDate: sat, endDate: sun };
    }
    case 'thisweek': {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      return { startDate: today, endDate: end };
    }
    case 'all': {
      const future = new Date(today);
      future.setFullYear(future.getFullYear() + 1);
      return { startDate: today, endDate: future };
    }
  }
}
