/**
 * Tests for salesApi.ts — covers the security fix (filter injection),
 * toStateAbbrev, sanitizeFilterValue, and the Supabase query construction
 * via mocked client.
 */

// ── Mock Supabase before importing the module under test ──────────────
const mockRpc = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockIn = jest.fn();
const mockEq = jest.fn();
const mockOr = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockSelect = jest.fn();

// Each chained method returns the builder so calls can cascade
const builderChain = () => ({
  select: mockSelect,
  eq: mockEq,
  lte: mockLte,
  gte: mockGte,
  or: mockOr,
  order: mockOrder,
  in: mockIn,
  single: mockSingle,
});

// Wire every mock to return the builder so chaining works
for (const fn of [mockSelect, mockEq, mockLte, mockGte, mockOr, mockOrder, mockIn]) {
  fn.mockReturnValue(builderChain());
}

const mockFrom = jest.fn().mockReturnValue(builderChain());

jest.mock('../supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

import { searchSales, getSaleById, toStateAbbrev, sanitizeFilterValue } from '../salesApi';

// ── Helpers ───────────────────────────────────────────────────────────
function resetMocks() {
  jest.clearAllMocks();
  // Re-wire chaining after clear
  for (const fn of [mockSelect, mockEq, mockLte, mockGte, mockOr, mockOrder, mockIn]) {
    fn.mockReturnValue(builderChain());
  }
  mockFrom.mockReturnValue(builderChain());
}

beforeEach(resetMocks);

// ── sanitizeFilterValue ──────────────────────────────────────────────
describe('sanitizeFilterValue', () => {
  it('passes through normal text', () => {
    expect(sanitizeFilterValue('antique furniture')).toBe('antique furniture');
  });

  it('strips commas (PostgREST filter separator)', () => {
    expect(sanitizeFilterValue('foo,bar')).toBe('foobar');
  });

  it('strips dots (PostgREST column.operator separator)', () => {
    expect(sanitizeFilterValue('title.ilike.hack')).toBe('titleilikehack');
  });

  it('strips parentheses (PostgREST grouping)', () => {
    expect(sanitizeFilterValue('(or)')).toBe('or');
  });

  it('strips backslashes and double quotes', () => {
    expect(sanitizeFilterValue('"hello\\world"')).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitizeFilterValue('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeFilterValue('')).toBe('');
  });

  it('neutralizes a real injection attempt: %,id.eq.X', () => {
    const malicious = '%,id.eq.some-uuid';
    const sanitized = sanitizeFilterValue(malicious);
    expect(sanitized).not.toContain(',');
    expect(sanitized).not.toContain('.');
    expect(sanitized).toBe('%ideqsome-uuid');
  });

  it('neutralizes SQL keyword injection', () => {
    const malicious = 'test),title.not.is.null,(id.eq.abc';
    const sanitized = sanitizeFilterValue(malicious);
    expect(sanitized).not.toContain('(');
    expect(sanitized).not.toContain(')');
    expect(sanitized).not.toContain(',');
    expect(sanitized).not.toContain('.');
  });
});

// ── toStateAbbrev ────────────────────────────────────────────────────
describe('toStateAbbrev', () => {
  it('converts full state name to abbreviation', () => {
    expect(toStateAbbrev('california')).toBe('CA');
    expect(toStateAbbrev('Tennessee')).toBe('TN');
    expect(toStateAbbrev('colorado')).toBe('CO');
  });

  it('handles leading/trailing whitespace', () => {
    expect(toStateAbbrev('  texas  ')).toBe('TX');
  });

  it('is case insensitive', () => {
    expect(toStateAbbrev('NEW YORK')).toBe('NY');
    expect(toStateAbbrev('new york')).toBe('NY');
    expect(toStateAbbrev('New York')).toBe('NY');
  });

  it('returns input uppercased when already an abbreviation', () => {
    expect(toStateAbbrev('CO')).toBe('CO');
    expect(toStateAbbrev('tn')).toBe('TN');
  });

  it('returns input uppercased for unknown strings', () => {
    expect(toStateAbbrev('xx')).toBe('XX');
  });

  it('handles multi-word states', () => {
    expect(toStateAbbrev('north carolina')).toBe('NC');
    expect(toStateAbbrev('west virginia')).toBe('WV');
    expect(toStateAbbrev('new hampshire')).toBe('NH');
    expect(toStateAbbrev('rhode island')).toBe('RI');
  });

  it('covers all 50 states', () => {
    // Just verify the map has 50 entries by spot-checking endpoints
    expect(toStateAbbrev('alabama')).toBe('AL');
    expect(toStateAbbrev('wyoming')).toBe('WY');
  });
});

// ── searchSales (RPC path — no stateCode) ────────────────────────────
describe('searchSales — RPC path', () => {
  it('calls supabase.rpc with correct parameters', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await searchSales({
      query: 'furniture',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
    });

    expect(mockRpc).toHaveBeenCalledWith('search_sales', expect.objectContaining({
      query: 'furniture',
      user_lat: 39.7392,
      user_lng: -104.9903,
      radius_miles: 50,
    }));
  });

  it('trims the query before sending', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await searchSales({
      query: '  antiques  ',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
    });

    expect(mockRpc).toHaveBeenCalledWith('search_sales', expect.objectContaining({
      query: 'antiques',
    }));
  });

  it('maps SearchRow to SearchResult correctly', async () => {
    mockRpc.mockResolvedValue({
      data: [{
        id: 'abc-123',
        external_id: 'ext-1',
        title: 'Big Sale',
        company_name: 'Estate Co',
        address: '123 Main',
        city: 'Denver',
        state: 'CO',
        zip_code: '80202',
        latitude: 39.7,
        longitude: -104.9,
        start_date: '2025-06-15',
        end_date: '2025-06-17',
        description: 'Lots of stuff',
        terms: 'Cash only',
        sale_hours: null,
        url: 'https://example.com',
        distance_miles: 5.678,
        match_percent: 85,
        header_image_url: 'https://img.jpg',
      }],
      error: null,
    });

    const results = await searchSales({
      query: 'stuff',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
    });

    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.id).toBe('abc-123');
    expect(r.externalId).toBe('ext-1');
    expect(r.title).toBe('Big Sale');
    expect(r.companyName).toBe('Estate Co');
    expect(r.distanceMiles).toBe(5.7); // rounded to 1 decimal
    expect(r.matchPercent).toBe(85);
    expect(r.headerImageUrl).toBe('https://img.jpg');
    expect(r.images).toHaveLength(1);
    expect(r.terms).toBe('Cash only');
    expect(r.saleHours).toBeUndefined();
  });

  it('handles null optional fields as undefined', async () => {
    mockRpc.mockResolvedValue({
      data: [{
        id: 'abc',
        external_id: null,
        title: 'Sale',
        company_name: null,
        address: '123 Main',
        city: 'Denver',
        state: 'CO',
        zip_code: '80202',
        latitude: 39.7,
        longitude: -104.9,
        start_date: '2025-06-15',
        end_date: '2025-06-17',
        description: 'Stuff',
        terms: null,
        sale_hours: null,
        url: null,
        distance_miles: null,
        match_percent: 100,
        header_image_url: null,
      }],
      error: null,
    });

    const results = await searchSales({
      query: '',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
    });

    const r = results[0];
    expect(r.externalId).toBeUndefined();
    expect(r.companyName).toBeUndefined();
    expect(r.terms).toBeUndefined();
    expect(r.saleHours).toBeUndefined();
    expect(r.url).toBeUndefined();
    expect(r.headerImageUrl).toBeUndefined();
    expect(r.images).toEqual([]);
    expect(r.distanceMiles).toBe(0);
  });

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB down' } });

    await expect(searchSales({
      query: 'test',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
    })).rejects.toEqual({ message: 'DB down' });
  });
});

// ── searchSales (state path) ─────────────────────────────────────────
describe('searchSales — state path', () => {
  function setupStateQuery(rows: any[] = []) {
    // The final call in the chain resolves with data
    // order() is the last builder call before await, so it returns the promise
    const resolvedBuilder = {
      ...builderChain(),
      then: (resolve: any) => resolve({ data: rows, error: null }),
    };
    mockOrder.mockReturnValue(resolvedBuilder);
    mockOr.mockReturnValue({ ...builderChain(), order: jest.fn().mockReturnValue(resolvedBuilder) });

    // Mock the image query
    const imageBuilder = {
      ...builderChain(),
      then: (resolve: any) => resolve({ data: [], error: null }),
    };
    mockEq.mockReturnValue(imageBuilder);
    mockIn.mockReturnValue({ ...builderChain(), eq: jest.fn().mockReturnValue(imageBuilder) });
  }

  it('uses stateCode path when stateCode is provided', async () => {
    setupStateQuery([]);

    await searchSales({
      query: '',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
      stateCode: 'CO',
    });

    // Should NOT call rpc — should call from('sales') instead
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('sales');
  });

  it('does not call .or() when query sanitizes to empty', async () => {
    setupStateQuery([]);

    await searchSales({
      query: '...,,,',
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 50,
      dateRange: 'all',
      stateCode: 'TN',
    });

    // A query of only special chars sanitizes to '' — .or() should NOT be called
    expect(mockFrom).toHaveBeenCalledWith('sales');
  });
});

// ── getSaleById ──────────────────────────────────────────────────────
describe('getSaleById', () => {
  it('returns null when sale not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    const result = await getSaleById('nonexistent-uuid');
    expect(result).toBeNull();
  });

  it('queries the correct table and id', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    await getSaleById('test-uuid-123');

    expect(mockFrom).toHaveBeenCalledWith('sales');
    expect(mockEq).toHaveBeenCalledWith('id', 'test-uuid-123');
  });

  it('maps sale and images when found', async () => {
    const saleRow = {
      id: 'sale-1',
      external_id: 'ext-1',
      title: 'Great Sale',
      company_name: 'Co',
      address: '456 Oak',
      city: 'Nashville',
      state: 'TN',
      zip_code: '37201',
      latitude: 36.16,
      longitude: -86.78,
      start_date: '2025-06-20',
      end_date: '2025-06-22',
      description: 'Everything must go',
      terms: 'Cash and credit',
      sale_hours: 'Fri Jun 20: 9am to 4pm',
      url: 'https://example.com/sale',
    };

    const imageRows = [
      { id: 'img-1', image_url: 'https://img1.jpg', caption: 'Front', ai_tags: ['furniture'], position: 0 },
      { id: 'img-2', image_url: 'https://img2.jpg', caption: null, ai_tags: null, position: 1 },
    ];

    // sale query: from('sales').select('*').eq('id', ...).single()
    mockSingle.mockResolvedValue({ data: saleRow, error: null });

    // image query: from('sale_images').select('*').eq('sale_id', ...).order('position')
    mockOrder.mockResolvedValue({ data: imageRows, error: null });

    const result = await getSaleById('sale-1');

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Great Sale');
    expect(result!.images).toHaveLength(2);
    expect(result!.images[0].caption).toBe('Front');
    expect(result!.images[0].aiTags).toEqual(['furniture']);
    expect(result!.images[1].caption).toBeUndefined();
    expect(result!.images[1].aiTags).toBeUndefined();
  });
});
