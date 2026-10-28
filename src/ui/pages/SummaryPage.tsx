import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../domain/categories';
import { formatMonth } from '../../domain/dates';
import { formatAmount } from '../../domain/money';
import { budgetStatus, summarizeMonth } from '../../domain/summary';
import { budgetsRepo } from '../../data/budgetsRepo';
import { expensesRepo } from '../../data/expensesRepo';
import { BudgetBar } from '../components/BudgetBar';
import { CategoryBadge } from '../components/CategoryBadge';
import { DonutChart } from '../components/DonutChart';
import { MonthNav } from '../components/MonthNav';
import { useCurrency } from '../hooks/useCurrency';
import { useMonthParam } from '../hooks/useMonthParam';

const pct = (part: number, total: number) => (total > 0 ? Math.round((part * 100) / total) : 0);

export function SummaryPage() {
  const { month, update } = useMonthParam();
  const currency = useCurrency();
  const expenses = useLiveQuery(() => expensesRepo.byMonth(month), [month]);
  const budgets = useLiveQuery(() => budgetsRepo.all(), []);

  if (!expenses || !budgets) {
    return (
      <main>
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      </main>
    );
  }

  const { totalMinor, byCategory } = summarizeMonth(expenses);
  const chartLabel =
    totalMinor > 0
      ? `Share of ${formatMonth(month)} spending: ` +
        CATEGORIES.filter((c) => byCategory[c.id] > 0)
          .map((c) => `${c.label} ${pct(byCategory[c.id], totalMinor)}%`)
          .join(', ')
      : `No spending in ${formatMonth(month)}`;

  return (
    <main>
      <div className="page-head">
        <div>
          <div className="eyebrow">Monthly summary</div>
          <MonthNav month={month} onChange={(m) => update({ month: m })} />
        </div>
      </div>

      <div className="grid-2 even summary-layout">
        <section className="card card-pad" aria-labelledby="spent-h">
          <div className="eyebrow" id="spent-h">
            Total spent
          </div>
          <div className="big-total num" data-testid="summary-total" style={{ margin: '6px 0 24px' }}>
            {formatAmount(totalMinor, currency)}
          </div>

          {totalMinor === 0 && (
            <div className="empty" style={{ padding: '8px 0 24px' }}>
              <div className="glyph" aria-hidden="true">
                ◯
              </div>
              <p>No spending recorded for this month, so there’s no chart yet.</p>
              <Link className="btn primary" to="/expenses/new">
                + Add expense
              </Link>
            </div>
          )}

          <div className={totalMinor > 0 ? 'donut-wrap' : undefined}>
            {totalMinor > 0 && <DonutChart byCategory={byCategory} totalMinor={totalMinor} label={chartLabel} />}
            <ul className="legend" aria-label="Spending by category">
              {CATEGORIES.map((c) => (
                <li key={c.id} data-category={c.id}>
                  <Link to={`/?month=${month}&cat=${c.id}`} style={{ textDecoration: 'none' }}>
                    <CategoryBadge id={c.id} />
                  </Link>
                  <span className="num">{formatAmount(byCategory[c.id], currency)}</span>
                  <span className="pct num">{totalMinor > 0 ? `${pct(byCategory[c.id], totalMinor)}%` : '—'}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card card-pad" aria-labelledby="budget-h">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="budget-h">Budgets</h2>
            <Link to="/budgets" className="btn small">
              Edit budgets
            </Link>
          </div>
          {CATEGORIES.map((c) => (
            <BudgetBar
              key={c.id}
              category={c.id}
              spentMinor={byCategory[c.id]}
              status={budgetStatus(byCategory[c.id], budgets[c.id])}
              currency={currency}
              action={<Link to="/budgets">Set a budget</Link>}
            />
          ))}
          <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>
            Normal under 80% · warning 80–100% · over above 100%.
          </p>
        </section>
      </div>
    </main>
  );
}
