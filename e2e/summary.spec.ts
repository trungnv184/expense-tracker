import { expect, test, type Page } from '@playwright/test';
import { seedStore } from './fixtures/db';

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

async function seed(page: Page, budgets: { category: string; amountMinor: number }[] = []) {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/summary');
  await seedStore(page, 'expenses', [
    row('f1', '2026-10-24', 'food', 1000),
    row('f2', '2026-10-25', 'food', 500),
    row('s1', '2026-10-26', 'sport', 2000),
    row('old', '2026-09-10', 'charity', 999),
  ]);
  if (budgets.length) await seedStore(page, 'budgets', budgets);
  await page.reload();
}

const legendAmount = (page: Page, cat: string) => page.locator(`.legend li[data-category="${cat}"] .num`).first();

test.describe('Monthly summary (REQ-006, REQ-007, REQ-009)', () => {
  test('shows the total and every category including zeros', async ({ page }) => {
    await seed(page);
    await expect(page.getByTestId('summary-total')).toHaveText('$35.00');
    await expect(legendAmount(page, 'food')).toHaveText('$15.00');
    await expect(legendAmount(page, 'sport')).toHaveText('$20.00');
    for (const cat of ['education', 'charity', 'living']) await expect(legendAmount(page, cat)).toHaveText('$0.00');
  });

  test('donut segments are proportional to category totals', async ({ page }) => {
    await seed(page);
    const chart = page.getByRole('img', { name: /Share of October 2026 spending/ });
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute('aria-label', /Food 43%.*Sport 57%/);
    const shares = await chart.locator('circle[data-category]').evaluateAll((els) =>
      Object.fromEntries(els.map((e) => [e.getAttribute('data-category'), Number(e.getAttribute('data-share'))])),
    );
    expect(shares.food).toBeCloseTo(15 / 35, 3);
    expect(shares.sport).toBeCloseTo(20 / 35, 3);
    expect(Object.keys(shares)).toEqual(['food', 'sport']);
  });

  test('an empty month replaces the chart with a message', async ({ page }) => {
    await seed(page);
    await page.getByRole('button', { name: /Next month/ }).click();
    await expect(page.getByText('No spending recorded for this month')).toBeVisible();
    await expect(page.getByRole('img', { name: /Share of/ })).toHaveCount(0);
    await expect(page.getByTestId('summary-total')).toHaveText('$0.00');
  });

  test('budget states: ok, warn, over and none', async ({ page }) => {
    await seed(page, [
      { category: 'food', amountMinor: 3000 }, // 15/30 = 50% ok
      { category: 'sport', amountMinor: 2400 }, // 20/24 = 83% warn
      { category: 'charity', amountMinor: 1000 }, // 0% ok
    ]);
    const bar = (cat: string) => page.locator(`.budget[data-category="${cat}"]`);
    await expect(bar('food')).toHaveAttribute('data-state', 'ok');
    await expect(bar('food')).toContainText('$15.00 left');
    await expect(bar('sport')).toHaveAttribute('data-state', 'warn');
    await expect(bar('sport')).toContainText('$4.00 left');
    await expect(bar('sport')).toContainText('83%');
    await expect(bar('education')).toHaveAttribute('data-state', 'none');
    await expect(bar('education')).toContainText('No budget');
    await expect(bar('education').getByRole('progressbar')).toHaveCount(0);

    await seedStore(page, 'budgets', [{ category: 'sport', amountMinor: 1500 }]);
    await page.reload();
    await expect(bar('sport')).toHaveAttribute('data-state', 'over');
    await expect(bar('sport')).toContainText('$5.00 over');
  });

  test('tapping a category opens the filtered list for that month', async ({ page }) => {
    await seed(page);
    await page.locator('.legend li[data-category="food"] a').click();
    await expect(page).toHaveURL(/#\/\?month=2026-10&cat=food$/);
    await expect(page.locator('.expense-list .note')).toHaveText(['f2', 'f1']);
  });

  test('month navigation changes the summary', async ({ page }) => {
    await seed(page);
    await page.getByRole('button', { name: /Previous month/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'September 2026' })).toBeVisible();
    await expect(page.getByTestId('summary-total')).toHaveText('$9.99');
  });

  test('two columns at 1280px, stacked and no horizontal scroll at 360px (REQ-017)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seed(page);
    const [a, b] = await page.locator('.summary-layout > section').all();
    const ba = (await a!.boundingBox())!;
    const bb = (await b!.boundingBox())!;
    expect(bb.x).toBeGreaterThan(ba.x + ba.width - 1);
    expect(Math.abs(bb.y - ba.y)).toBeLessThan(2);

    await page.setViewportSize({ width: 360, height: 740 });
    const sa = (await a!.boundingBox())!;
    const sb = (await b!.boundingBox())!;
    expect(sb.y).toBeGreaterThan(sa.y + sa.height - 1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('editing an expense moves its amount between category totals (REQ-003)', async ({ page }) => {
    await seed(page);
    await page.goto('./#/expenses/f1');
    await page.getByLabel('Amount').fill('15.00');
    await page.getByRole('radio', { name: /Sport/ }).check();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toHaveText('Expense updated');
    await page.goto('./#/summary?month=2026-10');
    await expect(legendAmount(page, 'food')).toHaveText('$5.00');
    await expect(legendAmount(page, 'sport')).toHaveText('$35.00');
    await expect(page.getByTestId('summary-total')).toHaveText('$40.00');
  });
});
