import { guard, NotFoundError, StorageError } from './errors';

describe('guard', () => {
  it('passes our NotFoundError through', async () => {
    await expect(guard(() => Promise.reject(NotFoundError.of('Expense', 'x')))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('treats a native IndexedDB NotFoundError as a storage failure', async () => {
    const native = new DOMException('No objectStore named foo', 'NotFoundError');
    await expect(guard(() => Promise.reject(native))).rejects.toBeInstanceOf(StorageError);
  });

  it('unwraps our NotFoundError from a wrapper with inner', async () => {
    const wrapped = Object.assign(new Error('wrapped'), { inner: NotFoundError.of('Expense', 'y') });
    await expect(guard(() => Promise.reject(wrapped))).rejects.toBeInstanceOf(NotFoundError);
  });
});
