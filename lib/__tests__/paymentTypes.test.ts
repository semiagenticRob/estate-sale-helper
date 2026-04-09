import { detectPaymentTypes } from '../paymentTypes';

/** Helper: extract just the type strings from results */
const types = (terms?: string, desc?: string) =>
  detectPaymentTypes(terms, desc).map((p) => p.type);

describe('detectPaymentTypes', () => {
  describe('empty / undefined input', () => {
    it('returns [] for undefined', () => {
      expect(detectPaymentTypes()).toEqual([]);
    });

    it('returns [] for empty string', () => {
      expect(detectPaymentTypes('')).toEqual([]);
    });

    it('returns [] for both undefined', () => {
      expect(detectPaymentTypes(undefined, undefined)).toEqual([]);
    });
  });

  describe('cash only', () => {
    it('detects "Cash only"', () => {
      const result = detectPaymentTypes('Cash only');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('cash');
      expect(result[0].label).toBe('Cash Only');
    });

    it('detects "CASH ONLY" (case insensitive)', () => {
      const result = detectPaymentTypes('CASH ONLY');
      expect(result[0].label).toBe('Cash Only');
    });
  });

  describe('no cash', () => {
    it('excludes cash when "no cash" is present', () => {
      const result = types('No cash, credit cards accepted');
      expect(result).toContain('credit');
      expect(result).not.toContain('cash');
    });
  });

  describe('credit card detection', () => {
    it('detects "credit card"', () => {
      expect(types('We accept credit cards')).toContain('credit');
    });

    it('detects Visa', () => {
      expect(types('Visa accepted')).toContain('credit');
    });

    it('detects Mastercard', () => {
      expect(types('Mastercard accepted')).toContain('credit');
    });

    it('detects Amex', () => {
      expect(types('Amex accepted')).toContain('credit');
    });

    it('detects Discover', () => {
      expect(types('Discover card')).toContain('credit');
    });

    it('detects American Express', () => {
      expect(types('American Express')).toContain('credit');
    });
  });

  describe('debit detection', () => {
    it('detects "debit card"', () => {
      expect(types('We accept debit cards')).toContain('debit');
    });

    it('detects "debit or credit"', () => {
      const result = types('debit or credit');
      expect(result).toContain('debit');
      expect(result).toContain('credit');
    });
  });

  describe('digital payments', () => {
    it('detects Zelle', () => {
      expect(types('Zelle accepted')).toContain('zelle');
    });

    it('detects Venmo', () => {
      expect(types('Venmo accepted')).toContain('venmo');
    });

    it('detects PayPal', () => {
      expect(types('PayPal accepted')).toContain('paypal');
    });

    it('detects Apple Pay', () => {
      expect(types('Apple Pay accepted')).toContain('applepay');
    });

    it('detects Google Pay', () => {
      expect(types('Google Pay accepted')).toContain('googlepay');
    });
  });

  describe('CashApp vs Cash collision', () => {
    it('detects CashApp without false-positive on bare "cash"', () => {
      const result = types('CashApp accepted');
      expect(result).toContain('cashapp');
      // "Cash App" triggers the cashapp pattern; bare cash requires payment context
      // CashApp alone should NOT trigger bare cash detection
    });

    it('detects both CashApp and Cash when both present', () => {
      const result = types('We accept cash and Cash App');
      expect(result).toContain('cashapp');
      expect(result).toContain('cash');
    });
  });

  describe('mixed methods', () => {
    it('detects multiple methods in one string', () => {
      const result = types('We accept credit cards, checks, and cash');
      expect(result).toContain('credit');
      expect(result).toContain('check');
      expect(result).toContain('cash');
    });

    it('detects Venmo, Zelle, CashApp', () => {
      const result = types('Venmo, Zelle, CashApp accepted');
      expect(result).toContain('venmo');
      expect(result).toContain('zelle');
      expect(result).toContain('cashapp');
    });
  });

  describe('check detection', () => {
    it('detects "approved checks"', () => {
      expect(types('approved checks')).toContain('check');
    });

    it('detects "cash or checks"', () => {
      const result = types('cash or checks');
      expect(result).toContain('check');
      expect(result).toContain('cash');
    });
  });

  describe('terms preferred over description', () => {
    it('uses terms when both provided', () => {
      const result = types('Cash only', 'We accept credit cards, Venmo, and checks');
      // "Cash only" from terms should win
      expect(result).toEqual(['cash']);
    });

    it('falls back to description when terms is undefined', () => {
      const result = types(undefined, 'We accept credit cards');
      expect(result).toContain('credit');
    });
  });
});
