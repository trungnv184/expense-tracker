import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seedStore } from './fixtures/db';

const ROUTES = ['#/', '#/expenses/new', '#/expenses/a', '#/summary', '#/budgets', '#/recurring', '#/recurring/new', '#/settings'];

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  await seedStore(page, 'expenses', [
    { id: 'a', date: '2026-10-27', month: '2026-10', category: 'food', amountMinor: 1250, note: 'Lunch', recurringId: null, createdAt: '2026-10-27T10:00:00Z' },
    { id: 'b', date: '2026-10-01', month: '2026-10', category: 'living', amountMinor: 50000, note: 'Rent', recurringId: 'r', createdAt: '2026-10-01T10:00:00Z' },
  ]);
  await seedStore(page, 'budgets', [
    { category: 'food', amountMinor: 1300 },
    { category: 'living', amountMinor: 40000 },
  ]);
  await seedStore(page, 'recurring', [
    { id: 'r', note: 'Rent', amountMinor: 50000, category: 'living', dayOfMonth: 1, startMonth: '2026-10', lastGeneratedMonth: '2026-10', active: true, stoppedAt: null, createdAt: '2026-10-01T00:00:00Z' },
  ]);
  await page.reload();
});

for (const width of [360, 1280]) {
  test.describe(`axe at ${width}px (REQ-018)`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const r of ROUTES) {
      test(`${r} has no serious or critical violations`, async ({ page }) => {
        await page.goto(`./${r}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
    }
  });
}

test('the add-expense journey works with the keyboard only, with a visible focus ring', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Tab until the "+ Add expense" link has focus.
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.textContent?.includes('Add expense'))) break;
  }
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'New expense' })).toBeVisible();
  await page.keyboard.press('Tab'); // skip "Back" link focus order may vary; type into amount directly via focus walk
  for (let i = 0; i < 10 && !(await page.evaluate(() => document.activeElement?.id === 'amount')); i++) await page.keyboard.press('Tab');
  await page.keyboard.type('8.40');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space'); // selects Food
  await page.keyboard.press('ArrowRight'); // Education
  await page.keyboard.press('Enter'); // submits the form
  await expect(page.getByRole('status')).toHaveText('Expense saved');
  await expect(page.getByRole('link', { name: /Education/ }).first()).toBeVisible();
});
