import { bootstrap } from './bootstrap';
import { db } from './db';
import { recurringRepo } from './recurringRepo';
import { StorageError } from './errors';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('bootstrap', () => {
  it('opens the database and requests persistent storage', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { ...navigator, storage: { persist } });
    expect(await bootstrap()).toEqual({ ok: true, generated: 0 });
    expect(db.isOpen()).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('reports failure when the database cannot open', async () => {
    vi.spyOn(db, 'open').mockRejectedValue(new Error('blocked'));
    expect(await bootstrap()).toEqual({ ok: false, reason: 'blocked' });
  });

  it('generates due recurring expenses on open (REQ-010)', async () => {
    const spy = vi.spyOn(recurringRepo, 'generateDue').mockResolvedValue(2);
    expect(await bootstrap()).toEqual({ ok: true, generated: 2 });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('still starts the app when generation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(recurringRepo, 'generateDue').mockRejectedValue(new StorageError('disk full'));
    expect(await bootstrap()).toEqual({ ok: true, generated: 0 });
  });
});
