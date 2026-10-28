import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { CATEGORIES, getCategory } from '../../domain/categories';
import { formatDayHeading, formatMonth } from '../../domain/dates';
import { formatAmount } from '../../domain/money';
import { expensesRepo } from '../../data/expensesRepo';
import type { Expense } from '../../data/db';
import { BudgetGlance } from '../components/BudgetGlance';
import { CategoryBadge } from '../components/CategoryBadge';
import { EmptyState } from '../components/EmptyState';
import { MonthNav } from '../components/MonthNav';
import { useCurrency } from '../hooks/useCurrency';
import { useMonthParam } from '../hooks/useMonthParam';

function groupByDate(rows: Expense[]): [string, Expense[]][] {
  const groups = new Map<string, Expense[]>();
  for (const e of rows) groups.set(e.date, [...(groups.get(e.date) ?? []), e]);
  return [...groups];
}

export function ExpensesPage() {
  const { month, cat, update } = useMonthParam();
  const currency = useCurrency();
  const expenses = useLiveQuery(() => expensesRepo.byMonth(month), [month]);

  const total = expenses?.reduce((sum, e) => sum + e.amountMinor, 0) ?? 0;
  const shown = expenses?.filter((e) => !cat || e.category === cat) ?? [];

  return (
    <main>
      <div className="page-head">
        <div>
          <div className="eyebrow">Expenses</div>
          <MonthNav month={month} onChange={(m) => update({ month: m })} />
        </div>
        <div className="month-total">
          Spent this month <span className="num" data-testid="month-total">{formatAmount(total, currency)}</span>
        </div>
      </div>

      {expenses === undefined ? (
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      ) : expenses.length === 0 ? (
        <EmptyState title="Nothing recorded yet">
          <p>No expenses for {formatMonth(month)}. Add the first one and it will show up here.</p>
          <Link className="btn primary" to="/expenses/new">
            + Add expense
          </Link>
        </EmptyState>
      ) : (
        <div className="grid-2 expenses-layout">
          <section aria-label="Expense list">
            <div className="chips" role="group" aria-label="Filter by category">
              <button type="button" className="chip" aria-pressed={cat === null} onClick={() => update({ cat: null })}>
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  aria-pressed={cat === c.id}
                  onClick={() => update({ cat: cat === c.id ? null : c.id })}
                >
                  <span aria-hidden="true">{c.icon}</span> {c.label}
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="muted">
                No {cat ? getCategory(cat).label : ''} expenses in {formatMonth(month)}.
              </p>
            ) : (
              <ul className="card expense-list" aria-label={`Expenses in ${formatMonth(month)}`}>
                {groupByDate(shown).map(([date, rows]) => (
                  <li key={date}>
                    <div className="day">{formatDayHeading(date)}</div>
                    <ul>
                      {rows.map((e) => (
                        <li key={e.id}>
                          <Link className="row" to={`/expenses/${e.id}`}>
                            <CategoryBadge id={e.category}>
                              {e.recurringId && (
                                <span className="badge" title="Created by a recurring expense">
                                  ↻ Recurring
                                </span>
                              )}
                            </CategoryBadge>
                            <span className="note">{e.note || '—'}</span>
                            <span className="amt num">{formatAmount(e.amountMinor, currency)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <BudgetGlance month={month} expenses={expenses} currency={currency} />
        </div>
      )}
    </main>
  );
}
