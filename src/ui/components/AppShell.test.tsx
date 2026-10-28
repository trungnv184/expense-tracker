import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../App';
import { formatMonth, monthOf, today } from '../../domain/dates';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  it('links to all five sections in both navs', () => {
    renderAt('/');
    for (const navName of ['Main', 'Main (mobile)']) {
      const nav = screen.getByRole('navigation', { name: navName });
      for (const label of ['Expenses', 'Summary', 'Budgets', 'Recurring', 'Settings']) {
        expect(within(nav).getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
      }
    }
  });

  it.each([
    ['/', formatMonth(monthOf(today()))],
    ['/summary', formatMonth(monthOf(today()))],
    ['/budgets', 'Budgets'],
    ['/recurring', 'Recurring'],
    ['/settings', 'Settings'],
  ])('renders the %s route', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });
});
