import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../App';
import { db } from '../../data/db';
import { expensesRepo } from '../../data/expensesRepo';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('SummaryPage', () => {
  it('lists all five categories and the total', async () => {
    await expensesRepo.add({ amountMinor: 1000, category: 'food', date: '2026-10-24', note: '' });
    await expensesRepo.add({ amountMinor: 2000, category: 'sport', date: '2026-10-26', note: '' });
    renderAt('/summary?month=2026-10');
    expect(await screen.findByTestId('summary-total')).toHaveTextContent('$30.00');
    const legend = screen.getByRole('list', { name: 'Spending by category' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('img', { name: /Food 33%, Sport 67%/ })).toBeInTheDocument();
  });

  it('shows the empty state instead of a chart', async () => {
    renderAt('/summary?month=2026-11');
    expect(await screen.findByText(/no chart yet/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
