import { expect, test } from '@playwright/test';

test('expenses, budgets, recurring items and currency survive a reload and a new page (REQ-014)', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/expenses/new');
  for (const [amount, cat] of [['1', 'Food'], ['2', 'Education'], ['3', 'Charity'], ['4', 'Sport'], ['5', 'Living cost']] as const) {
    await page.goto('./#/expenses/new');
    await page.getByLabel('Amount').fill(amount);
    await page.getByRole('radio', { name: new RegExp(cat) }).check();
    await page.getByRole('button', { name: 'Save expense' }).click();
    await expect(page.getByRole('status')).toHaveText('Expense saved');
  }
  await page.goto('./#/budgets');
  await page.getByLabel('Food monthly budget').fill('300');
  await page.getByRole('button', { name: 'Save budgets' }).click();
  await page.goto('./#/recurring/new');
  await page.getByLabel('Note').fill('Gym');
  await page.getByLabel('Amount').fill('35');
  await page.getByRole('radio', { name: /Sport/ }).check();
  await page.getByLabel('Day of month').selectOption('28');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.goto('./#/settings');
  await page.getByRole('combobox', { name: 'Currency' }).selectOption('EUR');

  for (const p of [page, await context.newPage()]) {
    if (p === page) await p.reload();
    await p.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
    await p.goto('./#/?month=2026-10');
    await expect(p.locator('.expense-list .row')).toHaveCount(6);
    await p.goto('./#/budgets');
    await expect(p.getByLabel('Food monthly budget')).toHaveValue('300.00');
    await p.goto('./#/recurring');
    await expect(p.getByRole('heading', { name: 'Gym' })).toBeVisible();
    await p.goto('./#/settings');
    await expect(p.getByRole('combobox', { name: 'Currency' })).toHaveValue('EUR');
  }
});
