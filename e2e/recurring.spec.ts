import { expect, test, type Page } from '@playwright/test';
import { readExpenses, readStore } from './fixtures/db';

async function at(page: Page, y: number, m: number, d: number) {
  await page.clock.setFixedTime(new Date(y, m - 1, d, 12, 0));
}

async function createRent(page: Page) {
  await page.goto('./#/recurring/new');
  await page.getByLabel('Note').fill('Rent');
  await page.getByLabel('Amount').fill('500');
  await page.getByRole('radio', { name: /Living cost/ }).check();
  await page.getByLabel('Day of month').selectOption('1');
  await page.getByLabel('Start month').fill('2026-08');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(/expenses? (was|were) added|Nothing was due yet/)).toBeVisible();
}

/** Open the app fresh at a route, so startup (and recurring generation) runs again. */
async function reopen(page: Page, hash = '#/') {
  await page.goto(`./${hash}`);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe('Recurring expenses (REQ-010, REQ-011)', () => {
  test('creating Rent from August backfills Aug–Oct on 28 Oct', async ({ page }) => {
    await at(page, 2026, 10, 28);
    await createRent(page);
    await expect(page.getByText('3 expenses were added')).toBeVisible();
    const rows = (await readExpenses(page)).map((e) => [e.date, e.amountMinor, e.category, e.note]).sort();
    expect(rows).toEqual([
      ['2026-08-01', 50000, 'living', 'Rent'],
      ['2026-09-01', 50000, 'living', 'Rent'],
      ['2026-10-01', 50000, 'living', 'Rent'],
    ]);
    await page.goto('./#/?month=2026-10');
    const row = page.getByRole('link', { name: /Rent/ });
    await expect(row).toContainText('↻ Recurring');
  });

  test('reopening the app creates no duplicates; a deleted one is not recreated', async ({ page }) => {
    await at(page, 2026, 10, 28);
    await createRent(page);
    await reopen(page);
    expect(await readExpenses(page)).toHaveLength(3);

    await page.goto('./#/?month=2026-08');
    await page.getByRole('link', { name: /Rent/ }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('status')).toHaveText('Expense deleted');
    await reopen(page);
    expect(await readExpenses(page)).toHaveLength(2);
  });

  test('generation runs on app open for a new month', async ({ page }) => {
    await at(page, 2026, 10, 28);
    await createRent(page);
    await at(page, 2026, 11, 2);
    await reopen(page, '#/?month=2026-11');
    await expect(page.getByRole('link', { name: /Rent/ })).toBeVisible();
    expect(await readExpenses(page)).toHaveLength(4);
  });

  test('day 31 falls on the last day of February', async ({ page }) => {
    await at(page, 2027, 2, 28);
    await page.goto('./#/recurring/new');
    await page.getByLabel('Note').fill('Phone plan');
    await page.getByLabel('Amount').fill('18');
    await page.getByRole('radio', { name: /Living cost/ }).check();
    await page.getByLabel('Day of month').selectOption('31');
    await page.getByLabel('Start month').fill('2027-02');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('1 expense was added')).toBeVisible();
    expect((await readExpenses(page)).map((e) => e.date)).toEqual(['2027-02-28']);
  });

  test('edit applies to future months only and the start month is read-only', async ({ page }) => {
    await at(page, 2026, 10, 28);
    await createRent(page);
    await page.getByRole('link', { name: 'Edit Rent' }).click();
    await expect(page.getByLabel('Start month')).toBeDisabled();
    await expect(page.getByText('Changes apply to months that haven’t been added yet')).toBeVisible();
    await page.getByLabel('Amount').fill('550');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status').first()).toHaveText('Recurring expense updated');
    await at(page, 2026, 11, 5);
    await reopen(page);
    await expect(page.getByRole('heading', { level: 1, name: 'November 2026' })).toBeVisible();
    const byMonth = Object.fromEntries((await readExpenses(page)).map((e) => [e.month, e.amountMinor]));
    expect(byMonth).toEqual({ '2026-08': 50000, '2026-09': 50000, '2026-10': 50000, '2026-11': 55000 });
  });

  test('stop asks for confirmation and prevents future expenses', async ({ page }) => {
    await at(page, 2026, 10, 28);
    await createRent(page);
    await page.getByRole('button', { name: 'Stop Rent' }).click();
    const dialog = page.getByRole('dialog', { name: /Stop “Rent”/ });
    await dialog.getByRole('button', { name: 'Keep it' }).click();
    expect((await readStore(page, 'recurring'))[0]).toMatchObject({ active: true });
    await page.getByRole('button', { name: 'Stop Rent' }).click();
    await dialog.getByRole('button', { name: 'Stop recurring' }).click();
    await expect(page.locator('.rec.stopped')).toContainText('Stopped');
    await at(page, 2027, 1, 15);
    await reopen(page);
    expect(await readExpenses(page)).toHaveLength(3);
  });

  test('form validation blocks bad input', async ({ page }) => {
    await at(page, 2026, 10, 28);
    await page.goto('./#/recurring/new');
    await page.getByLabel('Amount').fill('0');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Enter an amount greater than 0.')).toBeVisible();
    await expect(page.getByText('Pick a category.')).toBeVisible();
    expect(await readStore(page, 'recurring')).toEqual([]);
  });
});
