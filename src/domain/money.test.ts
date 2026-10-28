import { currencySymbol, formatAmount, minorToDecimal, parseAmount } from './money';

describe('parseAmount (REQ-001, REQ-019)', () => {
  it.each([
    ['12.50', 1250],
    ['12.5', 1250],
    ['12', 1200],
    ['0.01', 1],
    [' 7,25 ', 725],
    ['.5', 50],
    ['50000', 5_000_000],
  ])('parses %s to %i minor units', (input, minor) => {
    expect(parseAmount(input)).toEqual({ ok: true, minor });
  });

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['0', 'not_positive'],
    ['0.00', 'not_positive'],
    ['-4', 'not_positive'],
    ['abc', 'not_number'],
    ['1.2.3', 'not_number'],
    ['1e5', 'not_number'],
    ['.', 'not_number'],
    ['1.555', 'too_many_decimals'],
    ['-4.555', 'not_positive'],
  ])('rejects %j with %s', (input, error) => {
    expect(parseAmount(input)).toEqual({ ok: false, error });
  });
});

describe('formatAmount (REQ-013)', () => {
  it('formats USD with symbol and 2 decimals', () => {
    expect(formatAmount(1250, 'USD')).toBe('$12.50');
    expect(formatAmount(126120, 'USD')).toBe('$1,261.20');
  });

  it('formats VND with dot grouping, dong sign and no decimals', () => {
    const s = formatAmount(5_000_000, 'VND');
    expect(s).toMatch(/^50\.000\s₫$/);
  });

  it('gives the currency symbol', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('VND')).toBe('₫');
  });
});

describe('money accuracy (REQ-019)', () => {
  it('0.10 + 0.20 is exactly 0.30', () => {
    const a = parseAmount('0.10');
    const b = parseAmount('0.20');
    if (!a.ok || !b.ok) throw new Error('parse failed');
    expect(formatAmount(a.minor + b.minor, 'USD')).toBe('$0.30');
    expect(minorToDecimal(a.minor + b.minor)).toBe('0.30');
  });

  it('minorToDecimal pads cents', () => {
    expect(minorToDecimal(5)).toBe('0.05');
    expect(minorToDecimal(123456)).toBe('1234.56');
  });
});
