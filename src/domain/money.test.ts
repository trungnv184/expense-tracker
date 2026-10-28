import {
  amountInputFormat,
  currencySymbol,
  formatAmount,
  formatAmountInput,
  minorToDecimal,
  parseAmount,
  unformatAmountInput,
} from './money';

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
    expect(s).toMatch(/^50\.000\sđ$/);
  });

  it('gives the currency symbol', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('VND')).toBe('đ');
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

describe('amount input formatting', () => {
  const vnd = amountInputFormat('VND');
  const usd = amountInputFormat('USD');
  const eur = amountInputFormat('EUR');

  it('describes separators and symbol placement per currency', () => {
    expect(vnd).toEqual({ group: '.', decimal: ',', fractionDigits: 0, symbolAfter: true });
    expect(usd).toEqual({ group: ',', decimal: '.', fractionDigits: 2, symbolAfter: false });
  });

  it.each([
    ['1000000', '1.000.000'],
    ['1000000.00', '1.000.000'],
    ['999', '999'],
    ['', ''],
    ['-4', '-4'],
  ])('VND shows %j as %j', (raw, shown) => {
    expect(formatAmountInput(raw, vnd)).toBe(shown);
  });

  it.each([
    ['1234567.5', '1,234,567.5'],
    ['12.', '12.'],
    ['10.00', '10.00'],
    ['abc', 'abc'],
  ])('USD shows %j as %j', (raw, shown) => {
    expect(formatAmountInput(raw, usd)).toBe(shown);
  });

  it('reads typed text back into a plain decimal', () => {
    expect(unformatAmountInput('1.000.0001', vnd)).toBe('10000001');
    expect(unformatAmountInput('1 000,000', vnd)).toBe('1000000');
    expect(unformatAmountInput('1,234,567.5', usd)).toBe('1234567.5');
    expect(unformatAmountInput('1.234', usd)).toBe('1.234');
    expect(unformatAmountInput('1.234,5', eur)).toBe('1234.5');
    expect(unformatAmountInput('12.50', eur)).toBe('12.50');
    expect(unformatAmountInput('1.234', eur)).toBe('1234');
    expect(unformatAmountInput('-3', usd)).toBe('-3');
    expect(unformatAmountInput(' abc ', usd)).toBe('abc');
  });

  it('round-trips through parseAmount', () => {
    expect(parseAmount(unformatAmountInput(formatAmountInput('1000000', vnd), vnd))).toEqual({ ok: true, minor: 100_000_000 });
  });
});
