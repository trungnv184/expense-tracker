import { useSearchParams } from 'react-router-dom';
import { isCategoryId, type CategoryId } from '../../domain/categories';
import { isValidMonth, monthOf, today, type Month } from '../../domain/dates';

/** Month (?month=YYYY-MM, default current) and category filter (?cat=) kept in the URL. */
export function useMonthParam() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('month');
  const month: Month = raw && isValidMonth(raw) ? raw : monthOf(today());
  const rawCat = params.get('cat');
  const cat: CategoryId | null = isCategoryId(rawCat) ? rawCat : null;

  function update(next: { month?: Month; cat?: CategoryId | null }) {
    const p = new URLSearchParams(params);
    if (next.month !== undefined) p.set('month', next.month);
    if (next.cat !== undefined) {
      if (next.cat) p.set('cat', next.cat);
      else p.delete('cat');
    }
    setParams(p);
  }

  return { month, cat, update };
}
