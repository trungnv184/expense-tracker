import type { CategoryId } from '../domain/categories';
import { db, type Budget } from './db';
import { guard } from './errors';

export type BudgetMap = Partial<Record<CategoryId, number>>;

export function toBudgetMap(rows: Budget[]): BudgetMap {
  return Object.fromEntries(rows.map((b) => [b.category, b.amountMinor])) as BudgetMap;
}

export const budgetsRepo = {
  all(): Promise<BudgetMap> {
    return guard(async () => toBudgetMap(await db.budgets.toArray()));
  },

  set(category: CategoryId, amountMinor: number): Promise<void> {
    return guard(async () => {
      await db.budgets.put({ category, amountMinor });
    });
  },

  clear(category: CategoryId): Promise<void> {
    return guard(() => db.budgets.delete(category));
  },

  /** Apply sets and clears atomically (Budgets page save). */
  saveAll(changes: Partial<Record<CategoryId, number | null>>): Promise<void> {
    return guard(() =>
      db.transaction('rw', db.budgets, async () => {
        for (const [category, amount] of Object.entries(changes) as [CategoryId, number | null][]) {
          if (amount === null) await db.budgets.delete(category);
          else await db.budgets.put({ category, amountMinor: amount });
        }
      }),
    );
  },
};
