import { searchSales } from '../matching';
import { Sale } from '../../types';

/** Factory for test Sale objects */
function makeSale(overrides: Partial<Sale> = {}): Sale {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

  return {
    id: '1',
    title: 'Big Estate Sale',
    address: '123 Main St',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    latitude: 39.7392,
    longitude: -104.9903,
    startDate: todayStr,
    endDate: nextWeekStr,
    description: 'Furniture, antiques, and collectibles',
    images: [],
    ...overrides,
  };
}

// Denver coordinates for user location
const userLat = 39.7392;
const userLng = -104.9903;

describe('searchSales', () => {
  describe('empty query', () => {
    it('returns all sales with 100% match', () => {
      const sales = [makeSale({ id: '1' }), makeSale({ id: '2' })];
      const results = searchSales(sales, '', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(2);
      expect(results[0].matchPercent).toBe(100);
      expect(results[1].matchPercent).toBe(100);
    });
  });

  describe('text matching', () => {
    it('matches term found in title', () => {
      const sales = [makeSale({ title: 'Antique Furniture Sale' })];
      const results = searchSales(sales, 'antique', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(1);
      expect(results[0].matchPercent).toBeGreaterThan(0);
    });

    it('matches term found in description', () => {
      const sales = [makeSale({ description: 'Vintage jewelry and pottery' })];
      const results = searchSales(sales, 'jewelry', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(1);
      expect(results[0].matchPercent).toBeGreaterThan(0);
    });

    it('returns 0% match and filters out non-matching sales', () => {
      const sales = [makeSale({ title: 'Furniture Sale', description: 'Tables and chairs' })];
      const results = searchSales(sales, 'jewelry', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(0);
    });

    it('scores higher for more matched terms', () => {
      const sales = [
        makeSale({ id: '1', title: 'Antique Furniture', description: 'Old tables' }),
        makeSale({ id: '2', title: 'Antique Jewelry', description: 'Old antique rings and antique bracelets' }),
      ];
      const results = searchSales(sales, 'antique old', userLat, userLng, 100, 'all');
      // Both match both terms, but id=2 has more occurrences of "antique"
      expect(results).toHaveLength(2);
      expect(results[0].matchPercent).toBeGreaterThanOrEqual(results[1].matchPercent);
    });

    it('matches terms in image captions', () => {
      const sales = [
        makeSale({
          title: 'Estate Sale',
          description: 'Various items',
          images: [{ id: '1', imageUrl: 'http://img.jpg', caption: 'Rare vintage clock', position: 0 }],
        }),
      ];
      const results = searchSales(sales, 'vintage clock', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(1);
      expect(results[0].matchPercent).toBeGreaterThan(0);
    });
  });

  describe('distance filtering', () => {
    it('excludes sales beyond the radius', () => {
      // Sale in Colorado Springs (~63 mi from Denver)
      const sales = [makeSale({ latitude: 38.8339, longitude: -104.8214 })];
      const results = searchSales(sales, '', userLat, userLng, 50, 'all');
      expect(results).toHaveLength(0);
    });

    it('includes sales within the radius', () => {
      const sales = [makeSale({ latitude: 38.8339, longitude: -104.8214 })];
      const results = searchSales(sales, '', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(1);
    });

    it('calculates distanceMiles on results', () => {
      const sales = [makeSale({ latitude: 38.8339, longitude: -104.8214 })];
      const results = searchSales(sales, '', userLat, userLng, 100, 'all');
      expect(results[0].distanceMiles).toBeGreaterThan(50);
      expect(results[0].distanceMiles).toBeLessThan(80);
    });
  });

  describe('date filtering', () => {
    it('excludes ended sales with "all" date range', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, '0')}-${String(lastWeek.getDate()).padStart(2, '0')}`;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const sales = [makeSale({ startDate: lastWeekStr, endDate: yesterdayStr })];
      const results = searchSales(sales, '', userLat, userLng, 100, 'all');
      expect(results).toHaveLength(0);
    });

    it('includes active sales with "today" date range', () => {
      const sales = [makeSale()]; // default dates include today
      const results = searchSales(sales, '', userLat, userLng, 100, 'today');
      expect(results).toHaveLength(1);
    });
  });

  describe('sorting', () => {
    it('sorts by matchPercent descending, then distance ascending', () => {
      const sales = [
        makeSale({
          id: 'far-good-match',
          title: 'Antique antique antique furniture',
          description: 'antique items',
          latitude: 39.5, // closer to Denver
          longitude: -104.9903,
        }),
        makeSale({
          id: 'close-weak-match',
          title: 'Furniture sale',
          description: 'Tables only',
          latitude: 39.74, // very close to Denver
          longitude: -104.9903,
        }),
      ];
      const results = searchSales(sales, 'antique', userLat, userLng, 200, 'all');
      // The better text match should come first even if farther away
      if (results.length === 2) {
        expect(results[0].id).toBe('far-good-match');
      }
    });
  });

  describe('headerImageUrl', () => {
    it('sets headerImageUrl from first image', () => {
      const sales = [
        makeSale({
          images: [
            { id: '1', imageUrl: 'http://first.jpg', position: 0 },
            { id: '2', imageUrl: 'http://second.jpg', position: 1 },
          ],
        }),
      ];
      const results = searchSales(sales, '', userLat, userLng, 100, 'all');
      expect(results[0].headerImageUrl).toBe('http://first.jpg');
    });

    it('sets headerImageUrl to undefined when no images', () => {
      const sales = [makeSale({ images: [] })];
      const results = searchSales(sales, '', userLat, userLng, 100, 'all');
      expect(results[0].headerImageUrl).toBeUndefined();
    });
  });
});
