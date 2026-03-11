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

export type SaleStatus = 'active' | 'upcoming' | 'ending' | 'ended';

export function getSaleStatus(startStr: string, endStr: string): SaleStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);

  if (today > end) return 'ended';
  if (today < start) return 'upcoming';
  if (today.getTime() === end.getTime()) return 'ending';
  return 'active';
}
