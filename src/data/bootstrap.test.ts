import { bootstrap } from './bootstrap';
import { db } from './db';

afterEach(() => vi.restoreAllMocks());

describe('bootstrap', () => {
  it('opens the database and requests persistent storage', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { ...navigator, storage: { persist } });
    expect(await bootstrap()).toEqual({ ok: true });
    expect(db.isOpen()).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('reports failure when the database cannot open', async () => {
    vi.spyOn(db, 'open').mockRejectedValue(new Error('blocked'));
    expect(await bootstrap()).toEqual({ ok: false, reason: 'blocked' });
  });
});
