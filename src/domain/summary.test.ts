import { CATEGORY_IDS, type CategoryId } from './categories';
import { budgetStatus, summarizeMonth } from './summary';

describe('summarizeMonth (REQ-006)', () => {
  it('totals per category with zeros for the rest', () => {
    const s = summarizeMonth([
      { category: 'food', amountMinor: 1000 },
      { category: 'food', amountMinor: 500 },
      { category: 'sport', amountMinor: 2000 },
    ]);
    expect(s).toEqual({
      totalMinor: 3500,
      byCategory: { food: 1500, education: 0, charity: 0, sport: 2000, living: 0 },
    });
  });

  it('handles an empty month', () => {
    expect(summarizeMonth([]).totalMinor).toBe(0);
    expect(Object.keys(summarizeMonth([]).byCategory)).toEqual([...CATEGORY_IDS]);
  });

  it('total always equals the sum of rows and of categories (REQ-019)', () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let run = 0; run < 200; run++) {
      const rows = Array.from({ length: Math.floor(rand() * 60) }, () => ({
        category: CATEGORY_IDS[Math.floor(rand() * 5)] as CategoryId,
        amountMinor: 1 + Math.floor(rand() * 1_000_000),
      }));
      const s = summarizeMonth(rows);
      const rowSum = rows.reduce((a, r) => a + r.amountMinor, 0);
      const catSum = Object.values(s.byCategory).reduce((a, b) => a + b, 0);
      expect(s.totalMinor).toBe(rowSum);
      expect(catSum).toBe(rowSum);
    }
  });
});

describe('budgetStatus (REQ-009)', () => {
  it('ok under 80%', () => {
    expect(budgetStatus(12000, 30000)).toEqual({ kind: 'ok', percent: 40, remainingMinor: 18000, budgetMinor: 30000 });
  });
  it('warn at 80% and above', () => {
    expect(budgetStatus(25000, 30000)).toMatchObject({ kind: 'warn', percent: 83 });
    expect(budgetStatus(24000, 30000)).toMatchObject({ kind: 'warn', percent: 80 });
    expect(budgetStatus(30000, 30000)).toMatchObject({ kind: 'warn', percent: 100, remainingMinor: 0 });
  });
  it('over above 100% with the overspend', () => {
    expect(budgetStatus(33000, 30000)).toEqual({ kind: 'over', percent: 110, remainingMinor: -3000, budgetMinor: 30000 });
  });
  it('none without a budget', () => {
    expect(budgetStatus(7500)).toEqual({ kind: 'none' });
    expect(budgetStatus(7500, 0)).toEqual({ kind: 'none' });
  });
});
