import { monthOf, today as localToday, type LocalDate } from '../domain/dates';
import { dueOccurrences } from '../domain/recurring';
import type { ValidRecurring } from '../domain/validation';
import { db, newId, type Expense, type Recurring } from './db';
import { guard, NotFoundError } from './errors';

export type RecurringChanges = Omit<ValidRecurring, 'startMonth'>;

export const recurringRepo = {
  list(): Promise<Recurring[]> {
    return guard(async () =>
      (await db.recurring.toArray()).sort((a, b) =>
        a.active === b.active ? a.createdAt.localeCompare(b.createdAt) : a.active ? -1 : 1,
      ),
    );
  },

  get(id: string): Promise<Recurring> {
    return guard(async () => {
      const r = await db.recurring.get(id);
      if (!r) throw NotFoundError.of('Recurring expense', id);
      return r;
    });
  },

  create(v: ValidRecurring): Promise<Recurring> {
    return guard(async () => {
      const r: Recurring = {
        ...v,
        id: newId(),
        lastGeneratedMonth: null,
        active: true,
        stoppedAt: null,
        createdAt: new Date().toISOString(),
      };
      await db.recurring.add(r);
      return r;
    });
  },

  /** Changes apply to future occurrences only; generated expenses are untouched (REQ-011). */
  update(id: string, changes: RecurringChanges): Promise<Recurring> {
    return guard(() =>
      db.transaction('rw', db.recurring, async () => {
        const r = await db.recurring.get(id);
        if (!r) throw NotFoundError.of('Recurring expense', id);
        const next: Recurring = { ...r, ...changes };
        await db.recurring.put(next);
        return next;
      }),
    );
  },

  stop(id: string): Promise<void> {
    return guard(() =>
      db.transaction('rw', db.recurring, async () => {
        const r = await db.recurring.get(id);
        if (!r) throw NotFoundError.of('Recurring expense', id);
        await db.recurring.put({ ...r, active: false, stoppedAt: new Date().toISOString() });
      }),
    );
  },

  /**
   * Create every due occurrence and advance each cursor, atomically (REQ-010, §6.6).
   * Returns the number of expenses created.
   */
  generateDue(today: LocalDate = localToday()): Promise<number> {
    return guard(() =>
      db.transaction('rw', db.recurring, db.expenses, async () => {
        let created = 0;
        const defs = await db.recurring.toArray();
        for (const def of defs) {
          const due = dueOccurrences(def, today);
          if (due.length === 0) continue;
          const now = new Date().toISOString();
          const rows: Expense[] = due.map((o) => ({
            id: newId(),
            date: o.date,
            month: monthOf(o.date),
            category: def.category,
            amountMinor: def.amountMinor,
            note: def.note,
            recurringId: def.id,
            createdAt: now,
          }));
          await db.expenses.bulkAdd(rows);
          await db.recurring.update(def.id, { lastGeneratedMonth: due[due.length - 1]!.month });
          created += rows.length;
        }
        return created;
      }),
    );
  },
};
