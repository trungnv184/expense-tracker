import { dueOccurrences } from './recurring';

const rent = { dayOfMonth: 1, startMonth: '2026-08', lastGeneratedMonth: null, active: true };

describe('dueOccurrences (REQ-010)', () => {
  it('backfills from the start month to today', () => {
    expect(dueOccurrences(rent, '2026-10-28')).toEqual([
      { month: '2026-08', date: '2026-08-01' },
      { month: '2026-09', date: '2026-09-01' },
      { month: '2026-10', date: '2026-10-01' },
    ]);
  });

  it('returns nothing once the cursor reaches the current month', () => {
    expect(dueOccurrences({ ...rent, lastGeneratedMonth: '2026-10' }, '2026-10-28')).toEqual([]);
  });

  it('continues after the cursor in a later month', () => {
    expect(dueOccurrences({ ...rent, lastGeneratedMonth: '2026-10' }, '2026-11-01')).toEqual([
      { month: '2026-11', date: '2026-11-01' },
    ]);
  });

  it('clamps day 31 to the last day of short months, including leap years', () => {
    const d31 = { dayOfMonth: 31, startMonth: '2026-01', lastGeneratedMonth: null, active: true };
    expect(dueOccurrences(d31, '2026-03-31').map((o) => o.date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(dueOccurrences({ ...d31, startMonth: '2028-02' }, '2028-02-29').map((o) => o.date)).toEqual(['2028-02-29']);
  });

  it('does not create the current month before its day arrives', () => {
    const d30 = { dayOfMonth: 30, startMonth: '2026-09', lastGeneratedMonth: null, active: true };
    expect(dueOccurrences(d30, '2026-10-28')).toEqual([{ month: '2026-09', date: '2026-09-30' }]);
    expect(dueOccurrences(d30, '2026-10-30').map((o) => o.month)).toEqual(['2026-09', '2026-10']);
  });

  it('starts in the future: nothing yet', () => {
    expect(dueOccurrences({ ...rent, startMonth: '2026-12' }, '2026-10-28')).toEqual([]);
  });

  it('stopped definitions generate nothing', () => {
    expect(dueOccurrences({ ...rent, active: false }, '2026-10-28')).toEqual([]);
  });

  it('crosses year boundaries', () => {
    expect(dueOccurrences({ ...rent, startMonth: '2026-12' }, '2027-01-15').map((o) => o.month)).toEqual(['2026-12', '2027-01']);
  });
});
