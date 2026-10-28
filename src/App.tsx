import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './ui/components/AppShell';
import { ExpensesPage } from './ui/pages/ExpensesPage';
import { ExpenseFormPage } from './ui/pages/ExpenseFormPage';
import { SummaryPage } from './ui/pages/SummaryPage';
import { BudgetsPage } from './ui/pages/BudgetsPage';
import { RecurringPage } from './ui/pages/RecurringPage';
import { RecurringFormPage } from './ui/pages/RecurringFormPage';
import { SettingsPage } from './ui/pages/SettingsPage';

export const routes = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <ExpensesPage /> },
      { path: '/expenses/new', element: <ExpenseFormPage /> },
      { path: '/expenses/:id', element: <ExpenseFormPage /> },
      { path: '/summary', element: <SummaryPage /> },
      { path: '/budgets', element: <BudgetsPage /> },
      { path: '/recurring', element: <RecurringPage /> },
      { path: '/recurring/new', element: <RecurringFormPage /> },
      { path: '/recurring/:id', element: <RecurringFormPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
];

export function App() {
  return <RouterProvider router={createHashRouter(routes)} />;
}
