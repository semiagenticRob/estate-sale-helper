export type PaymentType = 'cash' | 'credit' | 'debit' | 'check' | 'zelle' | 'venmo' | 'paypal' | 'applepay' | 'cashapp';

interface PaymentInfo {
  type: PaymentType;
  label: string;
  bgColor: string;
  textColor: string;
}

const PAYMENT_DEFS: PaymentInfo[] = [
  { type: 'cash',     label: 'Cash',       bgColor: '#E6EDE7', textColor: '#3D6B42' },
  { type: 'credit',   label: 'Credit',     bgColor: '#E3E8F0', textColor: '#394E6E' },
  { type: 'debit',    label: 'Debit',      bgColor: '#E3E8F0', textColor: '#394E6E' },
  { type: 'check',    label: 'Check',      bgColor: '#F0E8DC', textColor: '#8B5E30' },
  { type: 'zelle',    label: 'Zelle',      bgColor: '#E8E0F0', textColor: '#5E4080' },
  { type: 'venmo',    label: 'Venmo',      bgColor: '#E0EBF0', textColor: '#2E6A8A' },
  { type: 'cashapp',  label: 'CashApp',    bgColor: '#E6EDE7', textColor: '#3D6B42' },
  { type: 'paypal',   label: 'PayPal',     bgColor: '#E0EBF0', textColor: '#2E6A8A' },
  { type: 'applepay', label: 'Apple Pay',  bgColor: '#ECEAE7', textColor: '#3B2A1A' },
];

const PAYMENT_PATTERNS: { type: PaymentType; pattern: RegExp }[] = [
  { type: 'credit',   pattern: /credit\s*card|visa|master\s*card|amex|american\s*express|discover\s*card|(?:accept|take|offer)s?\s+(?:\w+\s+)*credit/i },
  { type: 'debit',    pattern: /debit\s*card/i },
  { type: 'zelle',    pattern: /zelle/i },
  { type: 'venmo',    pattern: /venmo/i },
  { type: 'cashapp',  pattern: /cash\s*app/i },
  { type: 'paypal',   pattern: /paypal/i },
  { type: 'applepay', pattern: /apple\s*pay/i },
  // "check" only in payment contexts — "pay by check", "cash or check", "approved check", "check only"
  { type: 'check',    pattern: /\bpay(?:ment)?\b[^.]*\bcheck\b|\bcheck\s+(?:or|and|only)\b|\b(?:cash|credit|card)\s+(?:or|and)\s+check\b|\bapproved\s+check\b/i },
  // "cash" only in payment contexts — avoid "cashier", "cash register" false positives
  { type: 'cash',     pattern: /\bcash\s+only\b|\bcash\s+or\b|\bor\s+cash\b|\bpay(?:ment)?\b[^.]*\bcash\b|\baccept(?:s|ing)?\s+cash\b|\bcash[,\s]+(?:zelle|credit|check|venmo|debit)/i },
];

const CASH_ONLY_PATTERN = /cash\s+only/i;

export function detectPaymentTypes(terms?: string, description?: string): PaymentInfo[] {
  // Prefer terms (from "Terms & Conditions" section) over description
  const text = terms || description || '';
  if (!text) return [];

  if (CASH_ONLY_PATTERN.test(text)) {
    return [{ type: 'cash', label: 'Cash Only', bgColor: '#F0E8DC', textColor: '#8B5E30' }];
  }

  const found = new Set<PaymentType>();
  for (const { type, pattern } of PAYMENT_PATTERNS) {
    if (pattern.test(text)) {
      found.add(type);
    }
  }

  return PAYMENT_DEFS.filter((d) => found.has(d.type));
}
