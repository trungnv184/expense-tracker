import { expect, test } from '@playwright/test';
import { seedStore } from './fixtures/db';

const rows = [
  { id: 'a', date: '2026-10-27', month: '2026-10', category: 'food', amountMinor: 1250, note: 'A rather long note about lunch with the whole team downtown', recurringId: null, createdAt: '2026-10-27T10:00:00Z' },
  { id: 'b', date: '2026-10-01', month: '2026-10', category: 'living', amountMinor: 50000, note: 'Rent', recurringId: 'r', createdAt: '2026-10-01T10:00:00Z' },
];

const ROUTES = ['#/', '#/expenses/new', '#/expenses/a', '#/summary', '#/budgets', '#/recurring', '#/recurring/new', '#/settings'];

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  await seedStore(page, 'expenses', rows);
  await seedStore(page, 'budgets', [{ category: 'food', amountMinor: 30000 }]);
  await page.reload();
});

test.describe('360px (REQ-017)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  for (const r of ROUTES) {
    test(`${r} has no horizontal scroll`, async ({ page }) => {
      await page.goto(`./${r}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('1280px (REQ-017)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  test('expense list and budgets side by side', async ({ page }) => {
    await page.goto('./#/?month=2026-10');
    const list = (await page.getByRole('region', { name: 'Expense list' }).boundingBox())!;
    const glance = (await page.getByRole('complementary', { name: 'Budgets at a glance' }).boundingBox())!;
    expect(glance.x).toBeGreaterThanOrEqual(list.x + list.width - 1);
  });
  test('summary columns side by side', async ({ page }) => {
    await page.goto('./#/summary?month=2026-10');
    const [a, b] = await page.locator('.summary-layout > section').all();
    const ba = (await a!.boundingBox())!;
    const bb = (await b!.boundingBox())!;
    expect(bb.x).toBeGreaterThanOrEqual(ba.x + ba.width - 1);
  });
});
