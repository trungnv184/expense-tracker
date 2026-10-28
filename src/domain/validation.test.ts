import { validateBudget, validateExpense, validateRecurring } from './validation';

const good = { amount: '12.50', category: 'food', date: '2026-10-28', note: ' Lunch ' };

describe('validateExpense (REQ-001, REQ-003)', () => {
  it('accepts a valid expense and trims the note', () => {
    expect(validateExpense(good)).toEqual({
      ok: true,
      value: { amountMinor: 1250, category: 'food', date: '2026-10-28', note: 'Lunch' },
    });
  });

  it('reports every invalid field', () => {
    const r = validateExpense({ amount: '-1', category: null, date: '2026-02-30', note: 'x'.repeat(201) });
    expect(r).toEqual({
      ok: false,
      errors: { amount: 'not_positive', category: 'required', date: 'invalid', note: 'too_long' },
    });
  });

  it('allows an empty note and a 200-char note', () => {
    expect(validateExpense({ ...good, note: '' }).ok).toBe(true);
    expect(validateExpense({ ...good, note: 'x'.repeat(200) }).ok).toBe(true);
  });
});

describe('validateBudget (REQ-008)', () => {
  it('accepts positive amounts', () => {
    expect(validateBudget('300')).toEqual({ ok: true, value: 30000 });
  });
  it.each([
    ['-50', 'not_positive'],
    ['0', 'not_positive'],
    ['abc', 'not_number'],
  ])('rejects %s', (input, error) => {
    expect(validateBudget(input)).toEqual({ ok: false, errors: error });
  });
});

describe('validateRecurring (REQ-010)', () => {
  const rec = { amount: '500', category: 'living', note: 'Rent', dayOfMonth: 1, startMonth: '2026-08' };
  it('accepts a valid definition', () => {
    expect(validateRecurring(rec)).toEqual({
      ok: true,
      value: { amountMinor: 50000, category: 'living', note: 'Rent', dayOfMonth: 1, startMonth: '2026-08' },
    });
  });
  it.each([0, 32, 1.5, 'x'])('rejects day %s', (day) => {
    const r = validateRecurring({ ...rec, dayOfMonth: day });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.dayOfMonth).toBe('out_of_range');
  });
  it('rejects a bad start month', () => {
    const r = validateRecurring({ ...rec, startMonth: '2026-8' });
    expect(r.ok === false && r.errors.startMonth).toBe('invalid');
  });
});
