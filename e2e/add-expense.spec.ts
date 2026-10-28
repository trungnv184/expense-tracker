import { expect, test } from '@playwright/test';
import { readExpenses } from './fixtures/db';

test.describe('Add expense (REQ-001, REQ-002)', () => {
  test('saves 12.50 Food dated today and confirms', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
    await page.goto('./#/');
    await page.getByRole('link', { name: /Add expense/ }).first().click();
    await expect(page.getByRole('heading', { name: 'New expense' })).toBeVisible();
    await expect(page.getByLabel('Date')).toHaveValue('2026-10-28');

    await page.getByLabel('Amount').fill('12.50');
    await page.getByRole('radio', { name: /Food/ }).check();
    await page.getByLabel(/Note/).fill('Lunch with team');
    await page.getByRole('button', { name: 'Save expense' }).click();

    await expect(page.getByRole('status')).toHaveText('Expense saved');
    await expect(page).toHaveURL(/#\/\?month=2026-10$/);
    const rows = await readExpenses(page);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amountMinor: 1250, category: 'food', date: '2026-10-28', note: 'Lunch with team' });
  });

  const invalid: [string, string][] = [
    ['', 'Enter an amount.'],
    ['0', 'Enter an amount greater than 0.'],
    ['-3', 'Enter an amount greater than 0.'],
    ['4.555', 'Use at most 2 decimals.'],
  ];
  for (const [value, message] of invalid) {
    test(`blocks amount "${value}"`, async ({ page }) => {
      await page.goto('./#/expenses/new');
      await page.getByLabel('Amount').fill(value);
      await page.getByRole('radio', { name: /Food/ }).check();
      await page.getByRole('button', { name: 'Save expense' }).click();
      await expect(page.getByText(message)).toBeVisible();
      await expect(page).toHaveURL(/#\/expenses\/new$/);
      expect(await readExpenses(page)).toHaveLength(0);
    });
  }

  test('blocks a missing category', async ({ page }) => {
    await page.goto('./#/expenses/new');
    await page.getByLabel('Amount').fill('5');
    await page.getByRole('button', { name: 'Save expense' }).click();
    await expect(page.getByText('Pick a category.')).toBeVisible();
    expect(await readExpenses(page)).toHaveLength(0);
  });

  test('category picker shows the five categories in order and works by keyboard (REQ-018)', async ({ page }) => {
    await page.goto('./#/expenses/new');
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(5);
    expect(await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual([
      'food',
      'education',
      'charity',
      'sport',
      'living',
    ]);
    await page.getByLabel('Amount').fill('20');
    await page.getByRole('radio', { name: /Food/ }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: /Education/ })).toBeChecked();
    await page.getByRole('button', { name: 'Save expense' }).press('Enter');
    await expect(page.getByRole('status')).toHaveText('Expense saved');
  });
});
