export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }

  static of(what: string, id: string): NotFoundError {
    return new NotFoundError(`${what} ${id} not found`);
  }
}

/** Run a storage operation, normalising Dexie/IndexedDB failures to StorageError. */
export async function guard<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof StorageError) throw e;
    // Dexie re-wraps errors thrown inside a transaction, so match by name too.
    if (e instanceof Error && e.name === 'NotFoundError') throw new NotFoundError(e.message);
    throw new StorageError(e instanceof Error ? e.message : String(e), { cause: e });
  }
}
