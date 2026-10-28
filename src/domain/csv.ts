import { getCategory, type CategoryId } from './categories';
import type { LocalDate } from './dates';
import { minorToDecimal } from './money';

export interface CsvExpense {
  date: LocalDate;
  category: CategoryId;
  amountMinor: number;
  note: string;
  recurringId: string | null;
  createdAt?: string;
}

export const CSV_HEADER = 'date,category,amount,note,recurring';

/** RFC 4180 field quoting. */
export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** All expenses as CSV: header, rows by date ascending, CRLF, UTF-8 BOM (REQ-012). */
export function toCsv(expenses: readonly CsvExpense[]): string {
  const rows = [...expenses]
    .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    .map((e) =>
      [e.date, csvField(getCategory(e.category).label), minorToDecimal(e.amountMinor), csvField(e.note), e.recurringId ? 'true' : 'false'].join(','),
    );
  return '\uFEFF' + [CSV_HEADER, ...rows].join('\r\n') + '\r\n';
}

export function csvFilename(today: LocalDate): string {
  return `expenses-${today}.csv`;
}
