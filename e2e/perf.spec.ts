import { expect, test } from '@playwright/test';
import { seedMany } from './fixtures/seed';

test.describe('Performance with 5,000 expenses (REQ-015)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
    await page.goto('./#/');
    await seedMany(page, 5000);
    await page.goto('./#/?month=2026-10');
  });

  test('month list and summary render in under 1 second', async ({ page }) => {
    // Measure a full app open (reload) with 5,000 stored expenses.
    const t0 = Date.now();
    await page.reload();
    await expect(page.locator('.expense-list .row').first()).toBeVisible();
    const listMs = Date.now() - t0;

    await page.goto('./#/summary?month=2026-10');
    const t1 = Date.now();
    await page.reload();
    await expect(page.getByTestId('summary-total')).toBeVisible();
    await expect(page.getByRole('img', { name: /Share of October 2026/ })).toBeVisible();
    const summaryMs = Date.now() - t1;

    console.log(`list ${listMs}ms, summary ${summaryMs}ms`);
    expect(listMs).toBeLessThan(1000);
    expect(summaryMs).toBeLessThan(1000);
  });

  test('saving an expense updates list and totals in under 200 ms', async ({ page }) => {
    await page.reload();
    await page.goto('./#/expenses/new');
    await page.getByLabel('Amount').fill('1.23');
    await page.getByRole('radio', { name: /Food/ }).check();
    await page.getByLabel(/Note/).fill('perf-probe');
    const before = Date.now();
    await page.getByRole('button', { name: 'Save expense' }).click();
    await expect(page.getByRole('link', { name: /perf-probe/ })).toBeVisible();
    const ms = Date.now() - before;
    console.log(`save → visible ${ms}ms`);
    expect(ms).toBeLessThan(200);
  });
});
