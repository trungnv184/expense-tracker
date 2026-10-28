import { addMonths, dateInMonth, monthOf, type LocalDate, type Month } from './dates';

export interface RecurringSchedule {
  dayOfMonth: number;
  startMonth: Month;
  lastGeneratedMonth: Month | null;
  active: boolean;
}

export interface Occurrence {
  month: Month;
  date: LocalDate;
}

/**
 * Occurrences that are due but not yet generated (REQ-010, ADR-003).
 * Months after the cursor (or from startMonth) up to today's month whose date (day clamped
 * to month length) is on or before today. Inactive definitions have none.
 */
export function dueOccurrences(def: RecurringSchedule, today: LocalDate): Occurrence[] {
  if (!def.active) return [];
  const out: Occurrence[] = [];
  const last = monthOf(today);
  let m = def.lastGeneratedMonth ? addMonths(def.lastGeneratedMonth, 1) : def.startMonth;
  if (def.lastGeneratedMonth && def.startMonth > m) m = def.startMonth;
  for (; m <= last; m = addMonths(m, 1)) {
    const date = dateInMonth(m, def.dayOfMonth);
    if (date > today) break;
    out.push({ month: m, date });
  }
  return out;
}
