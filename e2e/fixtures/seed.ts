import type { Page } from '@playwright/test';
import { seedStore } from './db';

const CATS = ['food', 'education', 'charity', 'sport', 'living'];

/** n expenses spread over 12 months ending in 2026-10, deterministic. */
export function makeExpenses(n: number) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const monthIdx = i % 12; // 2025-11 .. 2026-10
    const y = monthIdx < 2 ? 2025 : 2026;
    const m = monthIdx < 2 ? 11 + monthIdx : monthIdx - 1;
    const d = 1 + (i % 28);
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    rows.push({
      id: `seed-${i}`,
      date,
      month: date.slice(0, 7),
      category: CATS[i % 5],
      amountMinor: 100 + ((i * 7919) % 50000),
      note: `Seeded expense ${i}`,
      recurringId: null,
      createdAt: `${date}T${String(i % 24).padStart(2, '0')}:00:00.000Z`,
    });
  }
  return rows;
}

export async function seedMany(page: Page, n: number) {
  const rows = makeExpenses(n);
  for (let i = 0; i < rows.length; i += 1000) await seedStore(page, 'expenses', rows.slice(i, i + 1000));
}
