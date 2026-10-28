import { NavLink, Link, Outlet } from 'react-router-dom';
import { ToastProvider } from '../hooks/useToast';

const NAV = [
  { to: '/', label: 'Expenses', glyph: '☰', end: true },
  { to: '/summary', label: 'Summary', glyph: '◔' },
  { to: '/budgets', label: 'Budgets', glyph: '◎' },
  { to: '/recurring', label: 'Recurring', glyph: '↻' },
  { to: '/settings', label: 'Settings', glyph: '⚙' },
] as const;

export function AppShell() {
  return (
    <ToastProvider>
      <header className="topbar">
        <Link className="brand" to="/">
          Ledger<small>expenses</small>
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={'end' in n}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <Link className="btn primary small add" to="/expenses/new">
          + Add expense
        </Link>
      </header>

      <Outlet />

      <Link className="btn primary fab" to="/expenses/new" aria-label="Add expense">
        +
      </Link>

      <nav className="tabbar" aria-label="Main (mobile)">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={'end' in n}>
            <span aria-hidden="true">{n.glyph}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </ToastProvider>
  );
}
