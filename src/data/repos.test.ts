import { db } from './db';
import { expensesRepo } from './expensesRepo';
import { budgetsRepo } from './budgetsRepo';
import { settingsRepo } from './settingsRepo';
import { NotFoundError, StorageError } from './errors';
import type { ValidExpense } from '../domain/validation';

const exp = (date: string, amountMinor = 1000, category: ValidExpense['category'] = 'food', note = ''): ValidExpense => ({
  date,
  amountMinor,
  category,
  note,
});

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  vi.restoreAllMocks();
});

describe('schema', () => {
  it('matches design §4', () => {
    const schema = Object.fromEntries(
      db.tables.map((t) => [t.name, [t.schema.primKey.name, ...t.schema.indexes.map((i) => i.name)].sort()]),
    );
    expect(schema).toEqual({
      expenses: ['category', 'date', 'id', 'month', 'recurringId'],
      budgets: ['category'],
      recurring: ['active', 'id'],
      settings: ['key'],
    });
  });
});

describe('expensesRepo', () => {
  it('adds with id, month and createdAt', async () => {
    const e = await expensesRepo.add(exp('2026-10-27', 1250));
    expect(e).toMatchObject({ month: '2026-10', amountMinor: 1250, recurringId: null });
    expect(e.id).toMatch(/[0-9a-f-]{36}/);
    expect(await expensesRepo.get(e.id)).toEqual(e);
  });

  it('lists a month newest date first, then most recently created first', async () => {
    const a = await expensesRepo.add(exp('2026-10-05'));
    const b = await expensesRepo.add(exp('2026-10-27'));
    await new Promise((r) => setTimeout(r, 2));
    const c = await expensesRepo.add(exp('2026-10-27'));
    await expensesRepo.add(exp('2026-09-30'));
    expect((await expensesRepo.byMonth('2026-10')).map((e) => e.id)).toEqual([c.id, b.id, a.id]);
    expect(await expensesRepo.byMonth('2026-09')).toHaveLength(1);
    expect(await expensesRepo.byMonth('2026-11')).toEqual([]);
  });

  it('update recomputes month', async () => {
    const e = await expensesRepo.add(exp('2026-10-27', 1000, 'food'));
    const u = await expensesRepo.update(e.id, exp('2026-09-01', 1500, 'sport'));
    expect(u).toMatchObject({ id: e.id, month: '2026-09', amountMinor: 1500, category: 'sport', createdAt: e.createdAt });
    expect(await expensesRepo.byMonth('2026-10')).toEqual([]);
  });

  it('removes', async () => {
    const e = await expensesRepo.add(exp('2026-10-27'));
    await expensesRepo.remove(e.id);
    expect(await expensesRepo.all()).toEqual([]);
  });

  it('throws NotFound for missing ids', async () => {
    await expect(expensesRepo.get('nope')).rejects.toBeInstanceOf(NotFoundError);
    await expect(expensesRepo.update('nope', exp('2026-10-01'))).rejects.toBeInstanceOf(NotFoundError);
    await expect(expensesRepo.remove('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('all() returns every expense by date ascending', async () => {
    await expensesRepo.add(exp('2026-10-27'));
    await expensesRepo.add(exp('2026-08-01'));
    expect((await expensesRepo.all()).map((e) => e.date)).toEqual(['2026-08-01', '2026-10-27']);
  });

  it('wraps storage failures in StorageError', async () => {
    vi.spyOn(db.expenses, 'add').mockRejectedValue(new Error('QuotaExceededError'));
    await expect(expensesRepo.add(exp('2026-10-27'))).rejects.toBeInstanceOf(StorageError);
  });
});

describe('budgetsRepo', () => {
  it('sets, lists and clears budgets', async () => {
    await budgetsRepo.set('food', 30000);
    await budgetsRepo.set('charity', 6000);
    expect(await budgetsRepo.all()).toEqual({ food: 30000, charity: 6000 });
    await budgetsRepo.clear('food');
    expect(await budgetsRepo.all()).toEqual({ charity: 6000 });
  });

  it('saveAll applies sets and clears together', async () => {
    await budgetsRepo.set('sport', 5000);
    await budgetsRepo.saveAll({ food: 30000, sport: null });
    expect(await budgetsRepo.all()).toEqual({ food: 30000 });
  });
});

describe('settingsRepo', () => {
  it('defaults to USD and stores a currency', async () => {
    expect(await settingsRepo.getCurrency()).toBe('USD');
    await settingsRepo.setCurrency('VND');
    expect(await settingsRepo.getCurrency()).toBe('VND');
  });
});
