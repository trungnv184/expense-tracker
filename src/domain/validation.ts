import { isCategoryId, type CategoryId } from './categories';
import { isValidDate, isValidMonth, type LocalDate, type Month } from './dates';
import { parseAmount, type AmountError } from './money';

export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E };

export const NOTE_MAX = 200;

export interface ExpenseInput {
  amount: string;
  category: string | null;
  date: string;
  note: string;
}

export interface ValidExpense {
  amountMinor: number;
  category: CategoryId;
  date: LocalDate;
  note: string;
}

export interface ExpenseErrors {
  amount?: AmountError;
  category?: 'required';
  date?: 'invalid';
  note?: 'too_long';
}

export function validateExpense(input: ExpenseInput): Result<ValidExpense, ExpenseErrors> {
  const errors: ExpenseErrors = {};
  const amount = parseAmount(input.amount);
  if (!amount.ok) errors.amount = amount.error;
  if (!isCategoryId(input.category)) errors.category = 'required';
  if (!isValidDate(input.date)) errors.date = 'invalid';
  const note = input.note.trim();
  if (note.length > NOTE_MAX) errors.note = 'too_long';
  if (Object.keys(errors).length > 0 || !amount.ok) return { ok: false, errors };
  return {
    ok: true,
    value: { amountMinor: amount.minor, category: input.category as CategoryId, date: input.date, note },
  };
}

export type BudgetError = 'not_number' | 'not_positive';

/** Budget input; '' is not valid here (clearing is a separate action). */
export function validateBudget(input: string): Result<number, BudgetError> {
  const r = parseAmount(input);
  if (r.ok) return { ok: true, value: r.minor };
  return { ok: false, errors: r.error === 'not_positive' ? 'not_positive' : 'not_number' };
}

export interface RecurringInput {
  amount: string;
  category: string | null;
  note: string;
  dayOfMonth: number | string;
  startMonth: string;
}

export interface ValidRecurring {
  amountMinor: number;
  category: CategoryId;
  note: string;
  dayOfMonth: number;
  startMonth: Month;
}

export interface RecurringErrors {
  amount?: AmountError;
  category?: 'required';
  note?: 'too_long';
  dayOfMonth?: 'out_of_range';
  startMonth?: 'invalid';
}

export function validateRecurring(input: RecurringInput): Result<ValidRecurring, RecurringErrors> {
  const errors: RecurringErrors = {};
  const amount = parseAmount(input.amount);
  if (!amount.ok) errors.amount = amount.error;
  if (!isCategoryId(input.category)) errors.category = 'required';
  const note = input.note.trim();
  if (note.length > NOTE_MAX) errors.note = 'too_long';
  const day = Number(input.dayOfMonth);
  if (!Number.isInteger(day) || day < 1 || day > 31) errors.dayOfMonth = 'out_of_range';
  if (!isValidMonth(input.startMonth)) errors.startMonth = 'invalid';
  if (Object.keys(errors).length > 0 || !amount.ok) return { ok: false, errors };
  return {
    ok: true,
    value: { amountMinor: amount.minor, category: input.category as CategoryId, note, dayOfMonth: day, startMonth: input.startMonth },
  };
}
