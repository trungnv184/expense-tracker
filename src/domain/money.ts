/**
 * Money is stored as integer hundredths of the currency unit, whatever the currency (ADR-002).
 * Parsing uses string arithmetic so values never pass through binary floating point.
 */

export type AmountError = 'required' | 'not_number' | 'not_positive' | 'too_many_decimals';
export type ParseResult = { ok: true; minor: number } | { ok: false; error: AmountError };

export const MAX_MINOR = 100_000_000_000; // 1 billion units — guards against absurd input

export function parseAmount(input: string): ParseResult {
  let s = input.trim().replace(/\s/g, '');
  if (s === '') return { ok: false, error: 'required' };
  // Accept a comma as the decimal separator when it is the only separator.
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  if (s.startsWith('-')) {
    return /^-\d*(\.\d*)?$/.test(s) && s !== '-' ? { ok: false, error: 'not_positive' } : { ok: false, error: 'not_number' };
  }
  if (!/^\d*(\.\d*)?$/.test(s) || s === '.') return { ok: false, error: 'not_number' };
  const [whole = '', frac = ''] = s.split('.');
  if (frac.length > 2) return { ok: false, error: 'too_many_decimals' };
  const minor = Number(whole || '0') * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR) return { ok: false, error: 'not_number' };
  if (minor <= 0) return { ok: false, error: 'not_positive' };
  return { ok: true, minor };
}

/** Plain decimal string for inputs and CSV, e.g. 1250 -> "12.50". */
export function minorToDecimal(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

const formatters = new Map<string, Intl.NumberFormat>();

export const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  VND: 'vi-VN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
};

function formatterFor(currency: string, locale?: string): Intl.NumberFormat {
  const loc = locale ?? CURRENCY_LOCALES[currency] ?? 'en-US';
  const key = `${loc}|${currency}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(loc, { style: 'currency', currency });
    formatters.set(key, f);
  }
  return f;
}

/** Format integer hundredths for display in the chosen currency (REQ-013). */
export function formatAmount(minor: number, currency: string, locale?: string): string {
  return formatterFor(currency, locale).format(minor / 100);
}

/** Currency symbol only, e.g. "$" or "₫", for input adornments. */
export function currencySymbol(currency: string, locale?: string): string {
  const part = formatterFor(currency, locale)
    .formatToParts(0)
    .find((p) => p.type === 'currency');
  return part?.value ?? currency;
}

export const AMOUNT_ERROR_TEXT: Record<AmountError, string> = {
  required: 'Enter an amount.',
  not_number: 'Enter a number, e.g. 12.50.',
  not_positive: 'Enter an amount greater than 0.',
  too_many_decimals: 'Use at most 2 decimals.',
};
