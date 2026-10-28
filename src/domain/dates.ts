/** Local calendar dates as strings: dates are "YYYY-MM-DD", months are "YYYY-MM". */

export type LocalDate = string;
export type Month = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): LocalDate {
  return toLocalDate(new Date());
}

export function isValidDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

export function isValidMonth(s: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

export function monthOf(date: LocalDate): Month {
  return date.slice(0, 7);
}

/** Days in month; month is 1-based. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function addMonths(month: Month, delta: number): Month {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}

/** Date in `month` for day-of-month `day`, clamped to the month's last day. */
export function dateInMonth(month: Month, day: number): LocalDate {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${month}-${pad(Math.min(day, daysInMonth(y, m)))}`;
}

export function formatMonth(month: Month, locale = 'en-US'): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function formatDayHeading(date: LocalDate, locale = 'en-GB'): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}
