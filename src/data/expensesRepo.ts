import { monthOf, type Month } from '../domain/dates';
import type { ValidExpense } from '../domain/validation';
import { db, newId, type Expense } from './db';
import { guard, NotFoundError } from './errors';

/** Newest date first; same date → most recently created first. */
export function byDateDesc(a: Expense, b: Expense): number {
  return a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date);
}

export const expensesRepo = {
  add(v: ValidExpense, recurringId: string | null = null): Promise<Expense> {
    return guard(async () => {
      const e: Expense = { ...v, id: newId(), month: monthOf(v.date), recurringId, createdAt: new Date().toISOString() };
      await db.expenses.add(e);
      return e;
    });
  },

  get(id: string): Promise<Expense> {
    return guard(async () => {
      const e = await db.expenses.get(id);
      if (!e) throw NotFoundError.of('Expense', id);
      return e;
    });
  },

  update(id: string, v: ValidExpense): Promise<Expense> {
    return guard(() =>
      db.transaction('rw', db.expenses, async () => {
        const e = await db.expenses.get(id);
        if (!e) throw NotFoundError.of('Expense', id);
        const next: Expense = { ...e, ...v, month: monthOf(v.date) };
        await db.expenses.put(next);
        return next;
      }),
    );
  },

  remove(id: string): Promise<void> {
    return guard(() =>
      db.transaction('rw', db.expenses, async () => {
        if (!(await db.expenses.get(id))) throw NotFoundError.of('Expense', id);
        await db.expenses.delete(id);
      }),
    );
  },

  byMonth(month: Month): Promise<Expense[]> {
    return guard(async () => (await db.expenses.where('month').equals(month).toArray()).sort(byDateDesc));
  },

  all(): Promise<Expense[]> {
    return guard(() => db.expenses.orderBy('date').toArray());
  },
};
