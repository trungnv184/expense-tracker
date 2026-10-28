import { CATEGORY_IDS, type CategoryId } from './categories';

export interface MonthSummary {
  totalMinor: number;
  byCategory: Record<CategoryId, number>;
}

/** Totals for one month's expenses; every category is present, zeros included (REQ-006). */
export function summarizeMonth(expenses: readonly { category: CategoryId; amountMinor: number }[]): MonthSummary {
  const byCategory = Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<CategoryId, number>;
  for (const e of expenses) byCategory[e.category] += e.amountMinor;
  const totalMinor = CATEGORY_IDS.reduce((sum, id) => sum + byCategory[id], 0);
  return { totalMinor, byCategory };
}

export type BudgetStatus =
  | { kind: 'none' }
  | { kind: 'ok' | 'warn' | 'over'; percent: number; remainingMinor: number; budgetMinor: number };

export const WARN_PERCENT = 80;

/** Budget state for a category in a month (REQ-009): warn at ≥ 80%, over above 100%. */
export function budgetStatus(spentMinor: number, budgetMinor?: number): BudgetStatus {
  if (!budgetMinor || budgetMinor <= 0) return { kind: 'none' };
  const percent = Math.floor((spentMinor * 100) / budgetMinor);
  const remainingMinor = budgetMinor - spentMinor;
  const kind = spentMinor > budgetMinor ? 'over' : percent >= WARN_PERCENT ? 'warn' : 'ok';
  return { kind, percent, remainingMinor, budgetMinor };
}
