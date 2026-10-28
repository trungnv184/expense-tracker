import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../App';
import { db } from '../../data/db';
import { expensesRepo } from '../../data/expensesRepo';

async function setup() {
  const e = await expensesRepo.add({ amountMinor: 1000, category: 'food', date: '2026-10-27', note: 'Lunch' });
  const router = createMemoryRouter(routes, { initialEntries: [`/expenses/${e.id}`] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { name: 'Edit expense' });
  return { e, router, user: userEvent.setup() };
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('Edit expense (REQ-003)', () => {
  it('prefills the form', async () => {
    await setup();
    expect(screen.getByLabelText('Amount')).toHaveValue('10.00');
    expect(screen.getByRole('radio', { name: /Food/ })).toBeChecked();
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-27');
    expect(screen.getByLabelText(/Note/)).toHaveValue('Lunch');
  });

  it('saves changes and returns to the month', async () => {
    const { e, router, user } = await setup();
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '15');
    await user.click(screen.getByRole('radio', { name: /Sport/ }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(router.state.location.search).toBe('?month=2026-10'));
    expect(screen.getByRole('status')).toHaveTextContent('Expense updated');
    expect(await expensesRepo.get(e.id)).toMatchObject({ amountMinor: 1500, category: 'sport' });
  });

  it('applies the same validation as adding', async () => {
    const { e, user } = await setup();
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '0');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Enter an amount greater than 0.')).toBeVisible();
    expect((await expensesRepo.get(e.id)).amountMinor).toBe(1000);
  });
});

describe('Delete expense (REQ-004)', () => {
  it('cancel keeps the expense', async () => {
    const { e, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this expense?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await expensesRepo.get(e.id)).toBeTruthy();
  });

  it('confirm removes the expense and returns to the list', async () => {
    const { router, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.getByRole('status')).toHaveTextContent('Expense deleted');
    expect(await expensesRepo.all()).toEqual([]);
  });
});

describe('Missing expense', () => {
  it('shows "Expense no longer exists" and returns to the list', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/expenses/does-not-exist'] });
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.getByRole('status')).toHaveTextContent('Expense no longer exists');
  });
});
