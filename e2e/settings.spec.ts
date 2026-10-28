import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { readExpenses, seedStore } from './fixtures/db';

const row = (id: string, date: string, category: string, amountMinor: number, note: string, recurringId: string | null = null) => ({
  id,
  date,
  month: date.slice(0, 7),
  category,
  amountMinor,
  note,
  recurringId,
  createdAt: `${date}T10:00:00.000Z`,
});

async function open(page: Page, rows: unknown[] = []) {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/settings');
  if (rows.length) await seedStore(page, 'expenses', rows);
  await page.reload();
}

async function exportCsv(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export CSV/ }).click();
  const d = await download;
  return { name: d.suggestedFilename(), text: await readFile((await d.path())!, 'utf8') };
}

test.describe('Settings (REQ-012, REQ-013)', () => {
  test('USD is the default and switching currency re-formats amounts everywhere', async ({ page }) => {
    await open(page, [row('a', '2026-10-27', 'food', 5_000_000, 'Big shop')]);
    await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveValue('USD');
    await expect(page.getByTestId('currency-preview')).toHaveText('$12.50 · $1,261.20');
    await page.getByRole('combobox', { name: 'Currency' }).selectOption('VND');
    await expect(page.getByTestId('currency-preview')).toHaveText(/13\sđ · 1\.261\sđ/);
    await page.goto('./#/?month=2026-10');
    await expect(page.getByTestId('month-total')).toHaveText(/^50\.000\sđ$/);
    expect((await readExpenses(page))[0]).toMatchObject({ amountMinor: 5_000_000 });
  });

  test('exports every expense as CSV sorted by date with quoting', async ({ page }) => {
    await open(page, [
      row('c', '2026-10-27', 'food', 1250, 'Lunch with team'),
      row('a', '2026-08-01', 'living', 50000, 'Rent', 'r1'),
      row('b', '2026-10-18', 'food', 2340, 'Lunch, "big" one'),
    ]);
    await expect(page.getByText('3 expenses')).toBeVisible();
    const { name, text } = await exportCsv(page);
    expect(name).toBe('expenses-2026-10-28.csv');
    expect(text.replace(/^\uFEFF/, '').split('\r\n')).toEqual([
      'date,category,amount,note,recurring',
      '2026-08-01,Living cost,500.00,Rent,true',
      '2026-10-18,Food,23.40,"Lunch, ""big"" one",false',
      '2026-10-27,Food,12.50,Lunch with team,false',
      '',
    ]);
    await expect(page.getByRole('status')).toHaveText('Downloaded expenses-2026-10-28.csv');
  });

  test('with no expenses the CSV has only the header', async ({ page }) => {
    await open(page);
    const { text } = await exportCsv(page);
    expect(text.replace(/^\uFEFF/, '')).toBe('date,category,amount,note,recurring\r\n');
  });

  test('explains where data lives (REQ-014, REQ-016)', async ({ page }) => {
    await open(page);
    const section = page.getByRole('region', { name: 'Your data' });
    await expect(section).toContainText('Stored only in this browser');
    await expect(section).toContainText('Works offline');
    await expect(section).toContainText('Export CSV regularly as a backup');
  });
});
