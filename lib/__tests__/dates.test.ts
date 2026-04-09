import { parseLocalDate, formatDate, formatDateRange, getSaleStatus, getDateBounds } from '../dates';

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as local date at midnight', () => {
    const d = parseLocalDate('2025-06-15');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('does not shift to adjacent day (timezone safety)', () => {
    // A common bug: new Date('2025-01-01') can become Dec 31 in US timezones
    const d = parseLocalDate('2025-01-01');
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(0);
  });

  it('handles end-of-month dates', () => {
    const d = parseLocalDate('2025-02-28');
    expect(d.getDate()).toBe(28);
    expect(d.getMonth()).toBe(1);
  });
});

describe('formatDate', () => {
  it('formats without weekday by default', () => {
    const result = formatDate('2025-06-15');
    expect(result).toBe('Jun 15');
  });

  it('includes weekday when requested', () => {
    const result = formatDate('2025-06-15', true);
    // June 15, 2025 is a Sunday
    expect(result).toBe('Sun, Jun 15');
  });
});

describe('formatDateRange', () => {
  it('returns single date when start equals end', () => {
    const result = formatDateRange('2025-06-15', '2025-06-15');
    expect(result).toBe('Jun 15');
  });

  it('returns range when start differs from end', () => {
    const result = formatDateRange('2025-06-15', '2025-06-17');
    expect(result).toBe('Jun 15 – Jun 17');
  });

  it('handles cross-month ranges', () => {
    const result = formatDateRange('2025-06-28', '2025-07-02');
    expect(result).toBe('Jun 28 – Jul 2');
  });
});

describe('getSaleStatus', () => {
  // Helper: format a Date as YYYY-MM-DD
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const today = new Date();
  const todayStr = fmt(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = fmt(yesterday);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = fmt(tomorrow);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = fmt(nextWeek);

  describe('date-only logic (no saleHours)', () => {
    it('returns "ended" when today is past end date', () => {
      expect(getSaleStatus(yesterdayStr, yesterdayStr)).toBe('ended');
    });

    it('returns "upcoming" when today is before start date', () => {
      expect(getSaleStatus(tomorrowStr, nextWeekStr)).toBe('upcoming');
    });

    it('returns "active" when today is within range (not last day)', () => {
      expect(getSaleStatus(yesterdayStr, tomorrowStr)).toBe('active');
    });

    it('returns "ending" when today equals end date (no hours)', () => {
      expect(getSaleStatus(yesterdayStr, todayStr)).toBe('ending');
    });

    it('returns "ending" for single-day sale today (no hours)', () => {
      expect(getSaleStatus(todayStr, todayStr)).toBe('ending');
    });
  });

  describe('with saleHours', () => {
    // Build a saleHours line for today
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
    const monthName = today.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = today.getDate();

    function hoursLine(open: string, close: string) {
      return `${dayName} ${monthName} ${dayNum}: ${open} to ${close}`;
    }

    it('returns "startingsoon" when before open time today', () => {
      // Sale opens at 11:59pm — always in the future during test
      const hours = hoursLine('11:59pm', '11:59pm');
      expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('startingsoon');
    });

    it('returns "active" when within open/close window', () => {
      // Sale open from 12am to 11:59pm — always active during test
      const hours = hoursLine('12am', '11:59pm');
      expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('active');
    });

    it('returns "ended" when past close on last day', () => {
      // Sale closed at 12am (midnight) — always past during test (unless test runs exactly at midnight)
      const hours = hoursLine('12am', '12am');
      const now = new Date();
      if (now.getHours() > 0 || now.getMinutes() > 0) {
        expect(getSaleStatus(todayStr, todayStr, hours)).toBe('ended');
      }
    });

    it('returns "upcoming" when past close but more days remain', () => {
      // Sale closed at 12am — past close, but sale continues tomorrow
      const hours = hoursLine('12am', '12am');
      const now = new Date();
      if (now.getHours() > 0 || now.getMinutes() > 0) {
        expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('upcoming');
      }
    });

    it('falls back to date-only logic when today not listed in hours', () => {
      // Hours for a different day
      const hours = 'Mon Jan 1: 10am to 3pm';
      // Today is in range but not listed → date-only logic
      expect(getSaleStatus(yesterdayStr, tomorrowStr, hours)).toBe('active');
    });
  });

  describe('time parsing edge cases (via saleHours)', () => {
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
    const monthName = today.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = today.getDate();

    it('handles "12pm" as noon correctly', () => {
      // 12pm to 11:59pm — if it's afternoon, should be active
      const hours = `${dayName} ${monthName} ${dayNum}: 12pm to 11:59pm`;
      const now = new Date();
      if (now.getHours() >= 12) {
        expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('active');
      } else {
        expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('startingsoon');
      }
    });

    it('handles "9:30 AM" format', () => {
      const hours = `${dayName} ${monthName} ${dayNum}: 9:30 AM to 11:59 PM`;
      const now = new Date();
      if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 30)) {
        expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('active');
      } else {
        expect(getSaleStatus(todayStr, tomorrowStr, hours)).toBe('startingsoon');
      }
    });
  });
});

describe('getDateBounds', () => {
  // Use a fixed "now" so tests are deterministic: Wednesday, June 18, 2025
  const wednesday = new Date(2025, 5, 18, 10, 0, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  it('"today" returns same-day bounds', () => {
    const { startDate, endDate } = getDateBounds('today', wednesday);
    expect(fmt(startDate)).toBe('2025-06-18');
    expect(fmt(endDate)).toBe('2025-06-18');
  });

  it('"tomorrow" returns today through tomorrow', () => {
    const { startDate, endDate } = getDateBounds('tomorrow', wednesday);
    expect(fmt(startDate)).toBe('2025-06-18');
    expect(fmt(endDate)).toBe('2025-06-19');
  });

  it('"thisweekend" returns Saturday and Sunday', () => {
    const { startDate, endDate } = getDateBounds('thisweekend', wednesday);
    // Wednesday June 18 → Saturday June 21, Sunday June 22
    expect(startDate.getDay()).toBe(6); // Saturday
    expect(endDate.getDay()).toBe(0);   // Sunday
    expect(fmt(startDate)).toBe('2025-06-21');
    expect(fmt(endDate)).toBe('2025-06-22');
  });

  it('"thisweekend" on Saturday returns this Saturday and Sunday', () => {
    const saturday = new Date(2025, 5, 21, 10, 0, 0);
    const { startDate, endDate } = getDateBounds('thisweekend', saturday);
    expect(fmt(startDate)).toBe('2025-06-21');
    expect(fmt(endDate)).toBe('2025-06-22');
  });

  it('"thisweekend" on Sunday returns next Saturday and Sunday', () => {
    const sunday = new Date(2025, 5, 22, 10, 0, 0);
    const { startDate, endDate } = getDateBounds('thisweekend', sunday);
    // Sunday → next Saturday is 6 days away
    expect(fmt(startDate)).toBe('2025-06-28');
    expect(fmt(endDate)).toBe('2025-06-29');
  });

  it('"thisweek" returns today + 6 days', () => {
    const { startDate, endDate } = getDateBounds('thisweek', wednesday);
    expect(fmt(startDate)).toBe('2025-06-18');
    expect(fmt(endDate)).toBe('2025-06-24');
  });

  it('"all" returns today + 1 year', () => {
    const { startDate, endDate } = getDateBounds('all', wednesday);
    expect(fmt(startDate)).toBe('2025-06-18');
    expect(fmt(endDate)).toBe('2026-06-18');
  });

  it('defaults to current time when now is omitted', () => {
    const { startDate } = getDateBounds('today');
    const today = new Date();
    expect(startDate.getFullYear()).toBe(today.getFullYear());
    expect(startDate.getMonth()).toBe(today.getMonth());
    expect(startDate.getDate()).toBe(today.getDate());
  });
});
