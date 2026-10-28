import { addMonths, dateInMonth, daysInMonth, formatMonth, isValidDate, isValidMonth, monthOf, toLocalDate } from './dates';

describe('dates', () => {
  it('formats a Date as a local YYYY-MM-DD string', () => {
    expect(toLocalDate(new Date(2026, 9, 28, 23, 59))).toBe('2026-10-28');
  });

  it('validates dates and months', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidMonth('2026-10')).toBe(true);
    expect(isValidMonth('2026-00')).toBe(false);
  });

  it('does month arithmetic across years', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthOf('2026-10-28')).toBe('2026-10');
  });

  it('clamps day-of-month to the month length', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(dateInMonth('2026-02', 31)).toBe('2026-02-28');
    expect(dateInMonth('2028-02', 31)).toBe('2028-02-29');
    expect(dateInMonth('2026-10', 1)).toBe('2026-10-01');
  });

  it('names months', () => {
    expect(formatMonth('2026-10')).toBe('October 2026');
  });
});
