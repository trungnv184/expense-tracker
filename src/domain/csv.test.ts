import { csvFilename, toCsv } from './csv';

const e = (date: string, category: 'food' | 'living', amountMinor: number, note: string, recurringId: string | null = null) => ({
  date,
  category,
  amountMinor,
  note,
  recurringId,
});

describe('toCsv (REQ-012)', () => {
  it('writes a BOM, header and rows sorted by date ascending with CRLF', () => {
    const csv = toCsv([e('2026-10-27', 'food', 1250, 'Lunch with team'), e('2026-08-01', 'living', 50000, 'Rent', 'r1'), e('2026-09-05', 'food', 5, '')]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'date,category,amount,note,recurring',
      '2026-08-01,Living cost,500.00,Rent,true',
      '2026-09-05,Food,0.05,,false',
      '2026-10-27,Food,12.50,Lunch with team,false',
      '',
    ]);
  });

  it('quotes commas, quotes and new lines', () => {
    const lines = toCsv([e('2026-10-18', 'food', 2340, 'Lunch, "big" one'), e('2026-10-19', 'food', 100, 'two\nlines')]).slice(1).split('\r\n');
    expect(lines[1]).toBe('2026-10-18,Food,23.40,"Lunch, ""big"" one",false');
    expect(lines[2]).toBe('2026-10-19,Food,1.00,"two\nlines",false');
  });

  it('writes only the header when there are no expenses', () => {
    expect(toCsv([])).toBe('\uFEFFdate,category,amount,note,recurring\r\n');
  });

  it('names the file by date', () => {
    expect(csvFilename('2026-10-28')).toBe('expenses-2026-10-28.csv');
  });
});
