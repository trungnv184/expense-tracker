import { addMonths, formatMonth, type Month } from '../../domain/dates';

export function MonthNav({ month, onChange }: { month: Month; onChange: (m: Month) => void }) {
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  return (
    <div className="month-nav">
      <button type="button" className="month-step" onClick={() => onChange(prev)} aria-label={`Previous month (${formatMonth(prev)})`}>
        ‹
      </button>
      <h1>{formatMonth(month)}</h1>
      <button type="button" className="month-step" onClick={() => onChange(next)} aria-label={`Next month (${formatMonth(next)})`}>
        ›
      </button>
    </div>
  );
}
