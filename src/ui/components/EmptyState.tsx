import type { ReactNode } from 'react';

export function EmptyState({ glyph = '∅', title, children }: { glyph?: string; title: string; children?: ReactNode }) {
  return (
    <div className="card empty">
      <div className="glyph" aria-hidden="true">
        {glyph}
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
