import { CATEGORIES, isCategoryId } from './categories';

describe('categories (REQ-002)', () => {
  it('keeps the original five first, then the added everyday categories, "Other" last', () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual([
      'Food',
      'Education',
      'Charity',
      'Sport',
      'Living cost',
      'Children',
      'Travel',
      'Coffee',
      'Fuel',
      'Electricity',
      'Grab fee',
      'Water',
      'Internet & phone',
      'Shopping',
      'Health',
      'Entertainment',
      'Other',
    ]);
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(10);
  });

  it('gives each category a distinct id, icon and colour token', () => {
    const n = CATEGORIES.length;
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(n);
    expect(new Set(CATEGORIES.map((c) => c.icon)).size).toBe(n);
    expect(new Set(CATEGORIES.map((c) => c.colorVar)).size).toBe(n);
  });

  it('recognises category ids', () => {
    expect(isCategoryId('food')).toBe(true);
    expect(isCategoryId('grab')).toBe(true);
    expect(isCategoryId('rent')).toBe(false);
    expect(isCategoryId(null)).toBe(false);
  });
});
