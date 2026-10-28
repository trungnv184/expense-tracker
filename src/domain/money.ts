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

/** Symbols people actually write, where they differ from Intl's (Vietnamese write "đ", not "₫"). */
const SYMBOL_OVERRIDES: Record<string, string> = { VND: 'đ' };

/** Format integer hundredths for display in the chosen currency (REQ-013). */
export function formatAmount(minor: number, currency: string, locale?: string): string {
  return formatterFor(currency, locale)
    .formatToParts(minor / 100)
    .map((p) => (p.type === 'currency' ? (SYMBOL_OVERRIDES[currency] ?? p.value) : p.value))
    .join('');
}

/** Currency symbol only, e.g. "$" or "đ", for input adornments. */
export function currencySymbol(currency: string, locale?: string): string {
  const part = formatterFor(currency, locale)
    .formatToParts(0)
    .find((p) => p.type === 'currency');
  return SYMBOL_OVERRIDES[currency] ?? part?.value ?? currency;
}

export interface AmountInputFormat {
  group: string;
  decimal: string;
  /** 0 for currencies without minor units in everyday use (VND, JPY). */
  fractionDigits: number;
  /** Whether the symbol sits after the number, e.g. "1.000.000 đ". */
  symbolAfter: boolean;
}

/** Separators and symbol placement used by the amount input for a currency. */
export function amountInputFormat(currency: string, locale?: string): AmountInputFormat {
  const f = formatterFor(currency, locale);
  const parts = f.formatToParts(1234567);
  const types = parts.map((p) => p.type);
  // Whole-unit currencies print no decimal part, so read the separator from a plain number format.
  const decimal = new Intl.NumberFormat(f.resolvedOptions().locale, { minimumFractionDigits: 1 })
    .formatToParts(1.5)
    .find((p) => p.type === 'decimal')?.value;
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: decimal ?? '.',
    fractionDigits: f.resolvedOptions().maximumFractionDigits ?? 2,
    symbolAfter: types.indexOf('currency') > types.indexOf('integer'),
  };
}

const CANONICAL = /^-?\d*(\.\d*)?$/;

/**
 * Turn what the user typed into the field (e.g. "1.000.000" for VND, "1,234.5" for USD)
 * into the plain decimal string parseAmount expects ("1000000", "1234.5").
 * Text that is not a number is returned trimmed but otherwise untouched so validation can flag it.
 */
export function unformatAmountInput(text: string, fmt: AmountInputFormat): string {
  const s = text.replace(/\s/g, '');
  if (s === '') return '';
  let out: string;
  if (fmt.fractionDigits === 0) {
    // No decimals in this currency: every "." or "," is a thousands separator.
    out = s.replace(/[.,]/g, '');
  } else if (s.includes(fmt.decimal)) {
    out = s.split(fmt.group).join('').replace(fmt.decimal, '.');
  } else if (fmt.group === '.' && /^-?\d*\.\d{0,2}$/.test(s)) {
    // "12.50" in a dot-grouping locale (e.g. EUR) can only be a decimal: groups have 3 digits.
    out = s;
  } else {
    out = s.split(fmt.group).join('');
  }
  return CANONICAL.test(out) ? out : text.trim();
}

/**
 * Display a plain decimal string with thousands grouping as the user types,
 * e.g. "1000000" -> "1.000.000" for VND, "1234.5" -> "1,234.5" for USD.
 */
export function formatAmountInput(raw: string, fmt: AmountInputFormat): string {
  if (!CANONICAL.test(raw) || raw === '' || raw === '-') return raw;
  const sign = raw.startsWith('-') ? '-' : '';
  const [whole = '', frac] = raw.slice(sign.length).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.group);
  if (frac === undefined) return sign + grouped;
  // Whole-unit currencies: hide a zero fraction such as the ".00" stored for an edited amount.
  if (fmt.fractionDigits === 0 && /^0*$/.test(frac)) return sign + grouped;
  return `${sign}${grouped}${fmt.decimal}${frac}`;
}

export const AMOUNT_ERROR_TEXT: Record<AmountError, string> = {
  required: 'Enter an amount.',
  not_number: 'Enter a number, e.g. 12.50.',
  not_positive: 'Enter an amount greater than 0.',
  too_many_decimals: 'Use at most 2 decimals.',
};
