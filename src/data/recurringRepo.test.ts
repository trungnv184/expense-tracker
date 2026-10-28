import { db } from './db';
import { expensesRepo } from './expensesRepo';
import { recurringRepo } from './recurringRepo';
import { StorageError } from './errors';

const rent = { amountMinor: 50000, category: 'living' as const, note: 'Rent', dayOfMonth: 1, startMonth: '2026-08' };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  vi.restoreAllMocks();
});

describe('recurringRepo.generateDue (REQ-010)', () => {
  it('backfills Aug–Oct for Rent on 2026-10-28, marked recurring', async () => {
    const r = await recurringRepo.create(rent);
    expect(await recurringRepo.generateDue('2026-10-28')).toBe(3);
    const all = await expensesRepo.all();
    expect(all.map((e) => [e.date, e.amountMinor, e.category, e.note, e.recurringId])).toEqual([
      ['2026-08-01', 50000, 'living', 'Rent', r.id],
      ['2026-09-01', 50000, 'living', 'Rent', r.id],
      ['2026-10-01', 50000, 'living', 'Rent', r.id],
    ]);
    expect((await recurringRepo.get(r.id)).lastGeneratedMonth).toBe('2026-10');
  });

  it('is idempotent', async () => {
    await recurringRepo.create(rent);
    await recurringRepo.generateDue('2026-10-28');
    expect(await recurringRepo.generateDue('2026-10-28')).toBe(0);
    expect(await expensesRepo.all()).toHaveLength(3);
  });

  it('does not recreate a deleted generated expense', async () => {
    await recurringRepo.create(rent);
    await recurringRepo.generateDue('2026-10-28');
    const [aug] = await expensesRepo.byMonth('2026-08');
    await expensesRepo.remove(aug!.id);
    await recurringRepo.generateDue('2026-10-28');
    expect(await expensesRepo.byMonth('2026-08')).toEqual([]);
  });

  it('day 31 lands on the last day of February', async () => {
    await recurringRepo.create({ ...rent, dayOfMonth: 31, startMonth: '2027-02' });
    await recurringRepo.generateDue('2027-02-28');
    expect((await expensesRepo.all()).map((e) => e.date)).toEqual(['2027-02-28']);
  });

  it('edits apply to future months only (REQ-011)', async () => {
    const r = await recurringRepo.create(rent);
    await recurringRepo.generateDue('2026-10-28');
    await recurringRepo.update(r.id, { amountMinor: 55000, category: 'living', note: 'Rent', dayOfMonth: 1 });
    await recurringRepo.generateDue('2026-11-02');
    const amounts = (await expensesRepo.all()).map((e) => [e.month, e.amountMinor]);
    expect(amounts).toEqual([
      ['2026-08', 50000],
      ['2026-09', 50000],
      ['2026-10', 50000],
      ['2026-11', 55000],
    ]);
  });

  it('stopped definitions create nothing and keep existing expenses (REQ-011)', async () => {
    const r = await recurringRepo.create(rent);
    await recurringRepo.generateDue('2026-10-28');
    await recurringRepo.stop(r.id);
    expect(await recurringRepo.generateDue('2026-12-15')).toBe(0);
    expect(await expensesRepo.all()).toHaveLength(3);
    const stopped = await recurringRepo.get(r.id);
    expect(stopped.active).toBe(false);
    expect(stopped.stoppedAt).not.toBeNull();
  });

  it('rolls back inserts and cursor when the transaction fails', async () => {
    const r = await recurringRepo.create(rent);
    vi.spyOn(db.recurring, 'update').mockRejectedValue(new Error('disk full'));
    await expect(recurringRepo.generateDue('2026-10-28')).rejects.toBeInstanceOf(StorageError);
    vi.restoreAllMocks();
    expect(await expensesRepo.all()).toEqual([]);
    expect((await recurringRepo.get(r.id)).lastGeneratedMonth).toBeNull();
    expect(await recurringRepo.generateDue('2026-10-28')).toBe(3);
  });

  it('lists active definitions first', async () => {
    const a = await recurringRepo.create(rent);
    const b = await recurringRepo.create({ ...rent, note: 'Gym' });
    await recurringRepo.stop(a.id);
    expect((await recurringRepo.list()).map((r) => r.id)).toEqual([b.id, a.id]);
  });
});
