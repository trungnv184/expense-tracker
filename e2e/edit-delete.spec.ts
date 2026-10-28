import { expect, test, type Page } from '@playwright/test';
import { readExpenses, seedStore } from './fixtures/db';

const base = { month: '2026-10', recurringId: null, createdAt: '2026-10-01T10:00:00.000Z' };

async function seed(page: Page) {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  await seedStore(page, 'expenses', [
    { ...base, id: 'e1', date: '2026-10-27', category: 'food', amountMinor: 1000, note: 'Lunch' },
    { ...base, id: 'e2', date: '2026-10-20', category: 'sport', amountMinor: 3000, note: 'Court' },
  ]);
  await page.reload();
}

test.describe('Edit and delete (REQ-003, REQ-004)', () => {
  test('editing 10.00 Food to 15.00 Sport updates the row and totals', async ({ page }) => {
    await seed(page);
    await expect(page.getByTestId('month-total')).toHaveText('$40.00');
    await page.getByRole('link', { name: /Lunch/ }).click();
    await expect(page.getByRole('heading', { name: 'Edit expense' })).toBeVisible();
    await page.getByLabel('Amount').fill('15.00');
    await page.getByRole('radio', { name: /Sport/ }).check();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toHaveText('Expense updated');
    const row = page.getByRole('link', { name: /Lunch/ });
    await expect(row).toContainText('Sport');
    await expect(row).toContainText('$15.00');
    await expect(page.getByTestId('month-total')).toHaveText('$45.00');
    await page.getByRole('group', { name: 'Filter by category' }).getByRole('button', { name: 'Sport', exact: true }).click();
    await expect(page.locator('.expense-list .note')).toHaveText(['Lunch', 'Court']);
  });

  test('edit uses the same validation as add', async ({ page }) => {
    await seed(page);
    await page.getByRole('link', { name: /Lunch/ }).click();
    await page.getByLabel('Amount').fill('1.234');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Use at most 2 decimals.')).toBeVisible();
    expect((await readExpenses(page)).find((e) => e.id === 'e1')).toMatchObject({ amountMinor: 1000 });
  });

  test('delete asks for confirmation; cancel keeps, confirm removes', async ({ page }) => {
    await seed(page);
    await page.getByRole('link', { name: /Lunch/ }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete this expense?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(await readExpenses(page)).toHaveLength(2);

    await page.getByRole('button', { name: 'Delete' }).click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('status')).toHaveText('Expense deleted');
    await expect(page.locator('.expense-list .note')).toHaveText(['Court']);
    await expect(page.getByTestId('month-total')).toHaveText('$30.00');
  });

  test('a missing expense id returns to the list with a message', async ({ page }) => {
    await seed(page);
    await page.goto('./#/expenses/nope');
    await expect(page.getByRole('status')).toHaveText('Expense no longer exists');
    await expect(page).toHaveURL(/#\/$/);
  });
});
