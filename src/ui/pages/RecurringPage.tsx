import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatMonth } from '../../domain/dates';
import { formatAmount } from '../../domain/money';
import type { Recurring } from '../../data/db';
import { recurringRepo } from '../../data/recurringRepo';
import { CategoryBadge } from '../components/CategoryBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { PageHeading } from '../components/PageHeading';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../hooks/useToast';

function dayText(day: number) {
  return day >= 29 ? `Day ${day} (last day in shorter months)` : `Day ${day} of each month`;
}

export function RecurringPage() {
  const currency = useCurrency();
  const toast = useToast();
  const location = useLocation();
  const generated = (location.state as { generated?: number } | null)?.generated;
  const list = useLiveQuery(() => recurringRepo.list(), []);
  const [stopping, setStopping] = useState<Recurring | null>(null);

  async function confirmStop() {
    if (!stopping) return;
    const r = stopping;
    setStopping(null);
    try {
      await recurringRepo.stop(r.id);
      toast(`Stopped “${r.note || 'recurring expense'}”`);
    } catch {
      toast('Couldn’t stop it. Please try again.');
    }
  }

  return (
    <main style={{ maxWidth: 720 }}>
      <PageHeading eyebrow="Fixed monthly costs" title="Recurring">
        <Link className="btn primary" to="/recurring/new">
          + New recurring
        </Link>
      </PageHeading>
      <p className="muted" style={{ margin: '-12px 0 24px' }}>
        Added automatically to each month when you open the app. Changes apply to future months only.
      </p>

      {generated !== undefined && (
        <div className="notice" role="status" style={{ marginBottom: 16 }}>
          <span aria-hidden="true">↻</span>
          <span>
            {generated === 0
              ? 'Nothing was due yet. It will be added when its day arrives.'
              : `${generated} expense${generated === 1 ? ' was' : 's were'} added for past and current months.`}
          </span>
        </div>
      )}

      {list === undefined ? (
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      ) : list.length === 0 ? (
        <EmptyState glyph="↻" title="No recurring expenses">
          <p>Add rent, tuition or memberships once and they’ll be filled in every month.</p>
          <Link className="btn primary" to="/recurring/new">
            + New recurring
          </Link>
        </EmptyState>
      ) : (
        <ul className="card rec-list" aria-label="Recurring expenses">
          {list.map((r) => (
            <li key={r.id} className={`rec${r.active ? '' : ' stopped'}`} data-id={r.id}>
              <div>
                <h3>{r.note || 'Untitled'}</h3>
                <div className="meta">
                  <CategoryBadge id={r.category} />
                  {r.active ? (
                    <>
                      <span>{dayText(r.dayOfMonth)}</span>
                      <span>Since {formatMonth(r.startMonth)}</span>
                    </>
                  ) : (
                    <>
                      <span className="badge" style={{ margin: 0 }}>
                        Stopped
                        {r.stoppedAt ? ` · ${formatMonth(r.stoppedAt.slice(0, 7))}` : ''}
                      </span>
                      <span>Past expenses kept</span>
                    </>
                  )}
                </div>
              </div>
              <div className="amt">{formatAmount(r.amountMinor, currency)}</div>
              {r.active && (
                <div className="acts">
                  <Link className="btn small" to={`/recurring/${r.id}`} aria-label={`Edit ${r.note || 'recurring expense'}`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn small ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setStopping(r)}
                    aria-label={`Stop ${r.note || 'recurring expense'}`}
                  >
                    Stop
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={stopping !== null}
        title={`Stop “${stopping?.note || 'recurring expense'}”?`}
        confirmLabel="Stop recurring"
        cancelLabel="Keep it"
        onConfirm={confirmStop}
        onCancel={() => setStopping(null)}
      >
        <p className="muted">No new expenses will be added from now on. Expenses already created stay in your history.</p>
      </ConfirmDialog>
    </main>
  );
}
