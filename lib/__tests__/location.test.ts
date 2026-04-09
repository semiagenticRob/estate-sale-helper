import { getDistanceMiles, DEFAULT_LOCATION } from '../location';

describe('getDistanceMiles', () => {
  it('returns 0 for the same point', () => {
    expect(getDistanceMiles(39.7392, -104.9903, 39.7392, -104.9903)).toBe(0);
  });

  it('calculates Denver to Colorado Springs (~60-70 mi)', () => {
    // Denver: 39.7392, -104.9903
    // Colorado Springs: 38.8339, -104.8214
    const dist = getDistanceMiles(39.7392, -104.9903, 38.8339, -104.8214);
    expect(dist).toBeGreaterThan(55);
    expect(dist).toBeLessThan(75);
  });

  it('calculates NYC to LA (~2,440-2,470 mi)', () => {
    // NYC: 40.7128, -74.0060
    // LA: 34.0522, -118.2437
    const dist = getDistanceMiles(40.7128, -74.006, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(2400);
    expect(dist).toBeLessThan(2500);
  });

  it('is symmetric (a→b equals b→a)', () => {
    const ab = getDistanceMiles(39.7392, -104.9903, 38.8339, -104.8214);
    const ba = getDistanceMiles(38.8339, -104.8214, 39.7392, -104.9903);
    expect(ab).toBeCloseTo(ba, 10);
  });

  it('handles short distances', () => {
    // Two points ~1 mile apart (approx 0.0145 degrees latitude)
    const dist = getDistanceMiles(39.7392, -104.9903, 39.7537, -104.9903);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2);
  });

  it('handles equator crossing', () => {
    const dist = getDistanceMiles(1, 0, -1, 0);
    // ~138 miles (2 degrees latitude at equator)
    expect(dist).toBeGreaterThan(130);
    expect(dist).toBeLessThan(145);
  });
});

describe('DEFAULT_LOCATION', () => {
  it('is Denver, CO', () => {
    expect(DEFAULT_LOCATION.latitude).toBeCloseTo(39.7392, 2);
    expect(DEFAULT_LOCATION.longitude).toBeCloseTo(-104.9903, 2);
    expect(DEFAULT_LOCATION.city).toContain('Denver');
  });
});
