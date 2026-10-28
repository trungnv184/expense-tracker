import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../App';
import { db } from '../../data/db';
import { expensesRepo } from '../../data/expensesRepo';
import { StorageError } from '../../data/errors';
import { today } from '../../domain/dates';

function renderForm() {
  const router = createMemoryRouter(routes, { initialEntries: ['/expenses/new'] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  vi.restoreAllMocks();
});

describe('Add expense form (REQ-001)', () => {
  it('saves a valid expense dated today and returns to the list', async () => {
    const user = userEvent.setup();
    const router = renderForm();
    expect(screen.getByLabelText('Date')).toHaveValue(today());
    await user.type(screen.getByLabelText('Amount'), '12.50');
    await user.click(screen.getByRole('radio', { name: /Food/ }));
    await user.type(screen.getByLabelText(/Note/), 'Lunch with team');
    await user.click(screen.getByRole('button', { name: 'Save expense' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.getByRole('status')).toHaveTextContent('Expense saved');
    const all = await expensesRepo.all();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ amountMinor: 1250, category: 'food', date: today(), note: 'Lunch with team' });
  });

  it.each([
    ['', 'Enter an amount.'],
    ['0', 'Enter an amount greater than 0.'],
    ['-4', 'Enter an amount greater than 0.'],
    ['1.555', 'Use at most 2 decimals.'],
  ])('blocks saving amount %j with an inline error', async (value, message) => {
    const user = userEvent.setup();
    renderForm();
    if (value) await user.type(screen.getByLabelText('Amount'), value);
    await user.click(screen.getByRole('radio', { name: /Food/ }));
    await user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Amount')).toHaveFocus();
    expect(await expensesRepo.all()).toHaveLength(0);
  });

  it('blocks saving without a category', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Amount'), '5');
    await user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(screen.getByText('Pick a category.')).toBeVisible();
    expect(await expensesRepo.all()).toHaveLength(0);
  });

  it('offers exactly the five categories in order', () => {
    renderForm();
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual([
      'food',
      'education',
      'charity',
      'sport',
      'living',
    ]);
  });

  it('limits the note to 200 characters', () => {
    renderForm();
    expect(screen.getByLabelText(/Note/)).toHaveAttribute('maxLength', '200');
  });

  it('keeps the form and shows an error when storage fails', async () => {
    vi.spyOn(expensesRepo, 'add').mockRejectedValue(new StorageError('quota'));
    const user = userEvent.setup();
    const router = renderForm();
    await user.type(screen.getByLabelText('Amount'), '9.99');
    await user.click(screen.getByRole('radio', { name: /Sport/ }));
    await user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t save the expense');
    expect(router.state.location.pathname).toBe('/expenses/new');
    expect(screen.getByLabelText('Amount')).toHaveValue('9.99');
  });

  it('shows the currency symbol from settings (REQ-013)', async () => {
    await db.settings.put({ key: 'currency', value: 'EUR' });
    renderForm();
    expect(await screen.findByText('€')).toBeInTheDocument();
  });
});
