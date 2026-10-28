import Dexie, { type EntityTable } from 'dexie';
import type { CategoryId } from '../domain/categories';
import type { LocalDate, Month } from '../domain/dates';

export interface Expense {
  id: string;
  date: LocalDate;
  month: Month;
  category: CategoryId;
  amountMinor: number;
  note: string;
  recurringId: string | null;
  createdAt: string;
}

export interface Budget {
  category: CategoryId;
  amountMinor: number;
}

export interface Recurring {
  id: string;
  note: string;
  amountMinor: number;
  category: CategoryId;
  dayOfMonth: number;
  startMonth: Month;
  lastGeneratedMonth: Month | null;
  active: boolean;
  stoppedAt: string | null;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export type LedgerDB = Dexie & {
  expenses: EntityTable<Expense, 'id'>;
  budgets: EntityTable<Budget, 'category'>;
  recurring: EntityTable<Recurring, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

export function createDb(name = 'ledger'): LedgerDB {
  const db = new Dexie(name) as LedgerDB;
  db.version(1).stores({
    expenses: 'id, month, date, category, recurringId',
    budgets: 'category',
    recurring: 'id, active',
    settings: 'key',
  });
  return db;
}

export const db = createDb();

export function newId(): string {
  return crypto.randomUUID();
}
