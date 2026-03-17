export type PaymentType = 'cash' | 'credit' | 'debit' | 'check' | 'zelle' | 'venmo' | 'paypal' | 'applepay' | 'cashapp' | 'googlepay';

interface PaymentInfo {
  type: PaymentType;
  label: string;
  bgColor: string;
  textColor: string;
}

const PAYMENT_DEFS: PaymentInfo[] = [
  { type: 'cash',      label: 'Cash',       bgColor: '#E6EDE7', textColor: '#3D6B42' },
  { type: 'credit',    label: 'Credit',     bgColor: '#E3E8F0', textColor: '#394E6E' },
  { type: 'debit',     label: 'Debit',      bgColor: '#E3E8F0', textColor: '#394E6E' },
  { type: 'check',     label: 'Check',      bgColor: '#F0E8DC', textColor: '#8B5E30' },
  { type: 'zelle',     label: 'Zelle',      bgColor: '#E8E0F0', textColor: '#5E4080' },
  { type: 'venmo',     label: 'Venmo',      bgColor: '#E0EBF0', textColor: '#2E6A8A' },
  { type: 'cashapp',   label: 'CashApp',    bgColor: '#E6EDE7', textColor: '#3D6B42' },
  { type: 'paypal',    label: 'PayPal',     bgColor: '#E0EBF0', textColor: '#2E6A8A' },
  { type: 'applepay',  label: 'Apple Pay',  bgColor: '#ECEAE7', textColor: '#3B2A1A' },
  { type: 'googlepay', label: 'Google Pay', bgColor: '#ECEAE7', textColor: '#3B2A1A' },
];

// Patterns that EXCLUDE a payment method
const NO_CASH_PATTERN = /\bno\s+cash\b/i;

const CASH_ONLY_PATTERN = /\bcash\s+only\b/i;

const PAYMENT_PATTERNS: { type: PaymentType; pattern: RegExp }[] = [
  // Credit: "credit card", "credit cards", bare "credit" near accept/payment words, or card brands
  { type: 'credit',    pattern: /\bcredit\s*cards?\b|\bvisa\b|\bmaster\s*card\b|\bamex\b|\bamerican\s*express\b|\bdiscover\b(?:\s*card)?|\baccept[^.]*\bcredit\b|\bwe\s+(?:accept|take|prefer)[^.]*\bcredit\b|\bcredit\s+(?:or|and)\b|\b(?:or|and)\s+credit\b/i },
  // Debit: "debit card" or bare "debit" near accept/payment words
  { type: 'debit',     pattern: /\bdebit\s*cards?\b|\baccept[^.]*\bdebit\b|\bwe\s+(?:accept|take|prefer)[^.]*\bdebit\b|\bdebit\s+(?:or|and)\b|\b(?:or|and)\s+debit\b/i },
  { type: 'zelle',     pattern: /\bzelle\b/i },
  { type: 'venmo',     pattern: /\bvenmo\b/i },
  { type: 'cashapp',   pattern: /\bcash\s*app\b/i },
  { type: 'paypal',    pattern: /\bpaypal\b/i },
  { type: 'applepay',  pattern: /\bapple\s*pay\b/i },
  { type: 'googlepay', pattern: /\bgoogle\s*pay\b/i },
  // Check: in payment contexts only
  { type: 'check',     pattern: /\bpay(?:ment)?\b[^.]*\bchecks?\b|\bchecks?\s+(?:or|and|only)\b|\b(?:cash|credit|card)\s+(?:or|and)\s+checks?\b|\bapproved\s+checks?\b|\baccept[^.]*\bchecks?\b/i },
  // Cash: at sentence start before comma, or near accept/payment/or words
  { type: 'cash',      pattern: /\bcash\s+only\b|\bcash\s*[,]\s*(?:approved|credit|debit|check)|\bcash\s+(?:or|and)\b|\b(?:or|and)\s+cash\b|\bpay(?:ment)?\b[^.]*\bcash\b|\baccept[^.]*\bcash\b|\bwe\s+(?:accept|take|prefer)[^.]*\bcash\b/i },
];

export function detectPaymentTypes(terms?: string, description?: string): PaymentInfo[] {
  // Prefer terms (from "Terms & Conditions" section) over description
  const text = terms || description || '';
  if (!text) return [];

  // Check for explicit "no cash" before checking for cash
  const noCash = NO_CASH_PATTERN.test(text);

  // "Cash only" is a special case
  if (!noCash && CASH_ONLY_PATTERN.test(text)) {
    return [{ type: 'cash', label: 'Cash Only', bgColor: '#F0E8DC', textColor: '#8B5E30' }];
  }

  const found = new Set<PaymentType>();
  for (const { type, pattern } of PAYMENT_PATTERNS) {
    if (pattern.test(text)) {
      found.add(type);
    }
  }

  // Remove cash if "no cash" was explicitly stated
  if (noCash) {
    found.delete('cash');
  }

  return PAYMENT_DEFS.filter((d) => found.has(d.type));
}
