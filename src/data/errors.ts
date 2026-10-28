export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends Error {
  /** Marker that survives Dexie re-wrapping; native IndexedDB NotFoundError DOMExceptions lack it. */
  readonly ledgerNotFound = true;

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
    // Dexie may re-wrap errors thrown inside a transaction; recognise ours by marker (or wrapped inner error).
    const inner = (e as { inner?: unknown })?.inner;
    if (isLedgerNotFound(e)) throw new NotFoundError((e as Error).message);
    if (isLedgerNotFound(inner)) throw new NotFoundError((inner as Error).message);
    throw new StorageError(e instanceof Error ? e.message : String(e), { cause: e });
  }
}

function isLedgerNotFound(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { ledgerNotFound?: unknown }).ledgerNotFound === true;
}
