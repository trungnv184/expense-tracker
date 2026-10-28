import { expect, test, type Page } from '@playwright/test';
import { readStore, seedStore } from './fixtures/db';

const row = (id: string, date: string, category: string, amountMinor: number) => ({
  id,
  date,
  month: date.slice(0, 7),
  category,
  amountMinor,
  note: id,
  recurringId: null,
  createdAt: `${date}T10:00:00.000Z`,
});

async function open(page: Page) {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/budgets');
  await seedStore(page, 'expenses', [row('f1', '2026-10-10', 'food', 12000), row('n1', '2026-11-03', 'food', 1000)]);
  await page.reload();
}

test.describe('Budgets (REQ-008)', () => {
  test('setting Food = 300.00 applies to this and later months', async ({ page }) => {
    await open(page);
    await page.getByLabel('Food monthly budget').fill('300.00');
    await page.getByRole('button', { name: 'Save budgets' }).click();
    await expect(page.getByRole('status')).toHaveText('Budgets saved');
    await expect(page).toHaveURL(/#\/summary$/);
    const food = page.locator('.budget[data-category="food"]');
    await expect(food).toContainText('$180.00 left');
    await expect(food).toContainText('of $300.00');
    await page.getByRole('button', { name: /Next month/ }).click();
    await expect(food).toContainText('$290.00 left');
    expect(await readStore(page, 'budgets')).toEqual([{ category: 'food', amountMinor: 30000 }]);
  });

  test('clearing a budget shows "No budget" without a bar', async ({ page }) => {
    await open(page);
    await seedStore(page, 'budgets', [{ category: 'food', amountMinor: 30000 }]);
    await page.reload();
    await expect(page.getByLabel('Food monthly budget')).toHaveValue('300.00');
    await page.getByRole('button', { name: 'Clear Food budget' }).click();
    await page.getByRole('button', { name: 'Save budgets' }).click();
    const food = page.locator('.budget[data-category="food"]');
    await expect(food).toContainText('No budget');
    await expect(food.getByRole('progressbar')).toHaveCount(0);
    expect(await readStore(page, 'budgets')).toEqual([]);
  });

  for (const bad of ['-50', '0', 'abc']) {
    test(`"${bad}" blocks saving with an inline error`, async ({ page }) => {
      await open(page);
      await page.getByLabel('Education monthly budget').fill(bad);
      await page.getByRole('button', { name: 'Save budgets' }).click();
      await expect(page.getByText('Enter an amount greater than 0, or clear the budget.')).toBeVisible();
      await expect(page).toHaveURL(/#\/budgets$/);
      expect(await readStore(page, 'budgets')).toEqual([]);
    });
  }

  test('budget panel sits beside the list only at ≥ 1024px (REQ-009, REQ-017)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page);
    await seedStore(page, 'budgets', [{ category: 'food', amountMinor: 30000 }]);
    await page.goto('./#/?month=2026-10');
    await page.reload();
    const panel = page.getByRole('complementary', { name: 'Budgets at a glance' });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('$180.00 left');
    const list = (await page.getByRole('region', { name: 'Expense list' }).boundingBox())!;
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThan(list.x + list.width - 1);

    await page.setViewportSize({ width: 800, height: 900 });
    await expect(panel).toBeHidden();
    await page.setViewportSize({ width: 360, height: 740 });
    await expect(panel).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
