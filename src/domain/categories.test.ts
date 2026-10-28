import { CATEGORIES, isCategoryId } from './categories';

describe('categories (REQ-002)', () => {
  it('has exactly the five categories in fixed order', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual(['food', 'education', 'charity', 'sport', 'living']);
    expect(CATEGORIES.map((c) => c.label)).toEqual(['Food', 'Education', 'Charity', 'Sport', 'Living cost']);
  });

  it('gives each category a distinct icon and colour token', () => {
    expect(new Set(CATEGORIES.map((c) => c.icon)).size).toBe(5);
    expect(new Set(CATEGORIES.map((c) => c.colorVar)).size).toBe(5);
  });

  it('recognises category ids', () => {
    expect(isCategoryId('food')).toBe(true);
    expect(isCategoryId('rent')).toBe(false);
    expect(isCategoryId(null)).toBe(false);
  });
});
