# Mockup map: Ledger (expense tracker)

Open `index.html` to start. All screens are static HTML plus `styles.css`, with no build step and no network.

## Visual direction
Editorial "ledger": warm paper background with faint ruled lines, ink-dark text, a serif display face for headings, monospace tabular figures for money. Each of the five categories has a fixed colour **and** icon **and** label (REQ-002, REQ-018: never colour alone). Mobile uses a bottom tab bar and a floating "+" button. From 768 px a top nav is shown, and from 1024 px the list and summary use two columns.

Design tokens (colours, type, spacing) live as CSS variables at the top of `styles.css`.

## Screen → requirement

| Screen | File | REQs | States shown |
|---|---|---|---|
| Expenses (home, month list) | `expenses.html` | REQ-001, REQ-002, REQ-003, REQ-005, REQ-009, REQ-010, REQ-013, REQ-017 | populated; category filter (chips, also `?cat=education`); filter with no results; toasts `?toast=saved/updated/deleted` |
| Expenses: empty month | `expenses-empty.html` | REQ-001, REQ-005 | empty (`?m=September` for other months) |
| Add expense | `add-expense.html` | REQ-001, REQ-002, REQ-013, REQ-018, REQ-019 | clean; validation errors (amount + category) |
| Edit / delete expense | `edit-expense.html` | REQ-002, REQ-003, REQ-004 | edit; delete confirmation dialog |
| Monthly summary | `summary.html` | REQ-006, REQ-007, REQ-009, REQ-017, REQ-019 | budget normal / warning (≥ 80%) / over (> 100%) / no budget |
| Monthly summary: empty | `summary-empty.html` | REQ-006, REQ-007, REQ-009 | chart replaced by empty message; all categories $0.00 |
| Budgets | `budgets.html` | REQ-002, REQ-008 | set; cleared ("No budget"); validation error |
| Recurring list | `recurring.html` | REQ-010, REQ-011 | active; stopped; "generated on open" notice; stop confirmation |
| Recurring form | `recurring-form.html` | REQ-002, REQ-010, REQ-011 | create; edit (`?edit=rent`) with future-only note |
| Settings | `settings.html` | REQ-012, REQ-013, REQ-014, REQ-016 | currency preview (USD/VND/EUR/GBP/JPY); export toast; CSV contents preview |

## Requirement coverage

| REQ | Title | Where |
|---|---|---|
| REQ-001 | Add an expense | add-expense, "+ Add" on expenses / empty states |
| REQ-002 | Fixed categories | every screen: same colour, icon, label, order |
| REQ-003 | Edit an expense | tap a row → edit-expense |
| REQ-004 | Delete an expense | edit-expense → Delete → confirm dialog |
| REQ-005 | Monthly list, navigation, filter | expenses, expenses-empty |
| REQ-006 | Monthly summary per category | summary, summary-empty |
| REQ-007 | Monthly chart | summary (donut + legend), summary-empty (empty message) |
| REQ-008 | Monthly budget per category | budgets |
| REQ-009 | Budget status | summary (full), expenses (at a glance, desktop) |
| REQ-010 | Recurring expenses | recurring, recurring-form, "↻ Recurring" badge on expenses |
| REQ-011 | Manage recurring | recurring (edit / stop), recurring-form edit mode |
| REQ-012 | Export to CSV | settings |
| REQ-013 | Currency setting | settings; currency symbol on every amount |
| REQ-014 | Local persistence | settings ("Your data"), otherwise **no UI** (storage behaviour) |
| REQ-015 | Performance | **no UI**: verified by measurement |
| REQ-016 | Privacy & offline | settings ("Your data"), otherwise **no UI** |
| REQ-017 | Responsive layout | all screens; two-column at ≥ 1024 px on expenses and summary |
| REQ-018 | Accessibility | all screens: labelled fields, focus ring, radio-based category picker, text status beside colour; verified by axe scan |
| REQ-019 | Money accuracy | totals on expenses / summary; otherwise **no UI** (integer minor units) |

## Notes for the architect
- Month navigation in the mockups links to the empty-state page for any month other than October; the real app renders the same list layout for every month.
- Recurring generation feedback: a one-line notice on the Recurring screen after expenses are generated on open. Treat this as nice-to-have and not required by the PRD.
- The "At a glance" budget panel on the expenses screen is shown only at ≥ 1024 px and repeats data from the summary.
- Category icons are emoji in the mockups; any icon set is fine as long as each category keeps one icon, one colour and one label.
