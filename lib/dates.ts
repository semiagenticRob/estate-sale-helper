import { DateRange } from '../types';

/** Parse a 'YYYY-MM-DD' string as a local date (avoids UTC-midnight timezone shift). */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
const DATE_OPTS_WITH_WEEKDAY: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export function formatDate(dateStr: string, includeWeekday = false): string {
  return parseLocalDate(dateStr).toLocaleDateString(
    'en-US',
    includeWeekday ? DATE_OPTS_WITH_WEEKDAY : DATE_OPTS
  );
}

export function formatDateRange(startStr: string, endStr: string): string {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-US', DATE_OPTS);
  }
  return `${start.toLocaleDateString('en-US', DATE_OPTS)} – ${end.toLocaleDateString('en-US', DATE_OPTS)}`;
}

export type SaleStatus = 'active' | 'upcoming' | 'startingsoon' | 'ending' | 'ended';

/**
 * Determine sale status using dates and optional daily hours.
 *
 * saleHours is a newline-separated string like:
 *   "Thu Mar 19: 10am to 3pm\nFri Mar 20: 9am to 2pm"
 *
 * If saleHours is available and today is a sale day, we parse
 * the time range to determine if the sale is currently live,
 * starting soon (today but not yet open), or has ended for the day.
 */
export function getSaleStatus(
  startStr: string,
  endStr: string,
  saleHours?: string
): SaleStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);

  if (today > end) return 'ended';
  if (today < start) return 'upcoming';

  // Today is within the sale date range — check times if available
  if (saleHours) {
    const todayTimes = parseTodayHours(saleHours, now);
    if (todayTimes) {
      if (now < todayTimes.open) return 'startingsoon';
      if (now >= todayTimes.open && now <= todayTimes.close) return 'active';
      // Past close time today — still within date range
      if (today.getTime() === end.getTime()) return 'ended';
      return 'upcoming'; // more days remain
    }
  }

  // No time info — fall back to date-only logic
  if (today.getTime() === end.getTime()) return 'ending';
  return 'active';
}

/**
 * Parse sale hours string to find today's open/close times.
 * Returns { open, close } as Date objects, or null if today isn't listed.
 */
function parseTodayHours(
  saleHours: string,
  now: Date
): { open: Date; close: Date } | null {
  const todayStr = now.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const todayMonth = now.toLocaleDateString('en-US', { month: 'short' });
  const todayDay = now.getDate();

  for (const line of saleHours.split('\n')) {
    // Match "Thu Mar 19: 10am to 3pm" or similar
    const match = line.match(
      /(\w{3})\s+(\w{3})\s+(\d{1,2}):\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
    );
    if (!match) continue;

    const [, dayName, month, day, openStr, closeStr] = match;

    // Check if this line is for today
    const isToday =
      (dayName.toLowerCase() === todayStr.toLowerCase() &&
        month.toLowerCase() === todayMonth.toLowerCase() &&
        parseInt(day) === todayDay);

    if (!isToday) continue;

    const open = parseTimeToDate(openStr, now);
    const close = parseTimeToDate(closeStr, now);
    if (open && close) return { open, close };
  }

  return null;
}

/**
 * Convert a DateRange value into concrete start/end Date boundaries.
 * Used by both client-side matching and server-side API queries.
 */
export function getDateBounds(
  range: DateRange,
  now: Date = new Date()
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

/** Parse "10am", "9:30 PM", etc. into a Date for today. */
function parseTimeToDate(timeStr: string, now: Date): Date | null {
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3].toLowerCase();

  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
