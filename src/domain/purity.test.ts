import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('domain purity', () => {
  it('does not import from data or ui layers', () => {
    const dir = __dirname;
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src, f).not.toMatch(/from ['"]\.\.\/(data|ui)/);
      expect(src, f).not.toMatch(/from ['"](dexie|react)/);
    }
  });
});
