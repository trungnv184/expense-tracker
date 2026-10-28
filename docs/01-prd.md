# PRD: Expense Tracker

| | |
|---|---|
| Status | Draft |
| Last updated | 2026-10-28 |
| Source idea | A tool to keep track of all my expenses, including food, education, charity, sport and living cost |

## 1. Problem & context
The user spends money across five recurring areas of life (food, education, charity, sport and living cost) but has no single place that shows where the money goes each month. Without that view it is hard to know whether spending in one area is crowding out another, or whether a monthly limit has already been passed. Generic finance apps are heavy (bank linking, accounts, sign-up) for what is a personal, manual habit. A lightweight web app that records an expense in a few seconds, handles fixed repeating costs automatically, and shows monthly totals against budgets solves this.

## 2. Goals & success metrics
| Goal | Metric | Target |
|---|---|---|
| Recording an expense is quick | Time from opening the app to a saved expense | ≤ 15 seconds, ≤ 4 inputs |
| The user knows where money goes | Monthly summary shows totals for all 5 categories | 100% of months with data |
| The user stays within limits | Budget status visible per category for the current month | Visible on the summary screen without extra navigation |
| Fixed costs need no manual entry | Recurring expenses generated automatically | 0 manual re-entries of a configured recurring cost |
| Data is portable | All expenses exportable | One-click CSV with every expense |

## 3. Users / personas
- **Personal tracker (the user)**: one person tracking their own spending in a single currency. Wants fast entry on phone or laptop, a clear monthly picture, and no account or server. Constraint: enters data manually; uses the app from a browser.

## 4. User journeys & stories
### Journey: Record a daily expense
1. Open the app (lands on the current month).
2. Tap "Add expense", enter amount, pick category, optionally change date and add a note.
3. Save; the expense appears in the month's list and totals update.

### Journey: Review the month
1. Open the summary for the current (or a past) month.
2. See total spent, the total per category, a chart, and remaining budget per category.
3. Drill into a category to see its expenses.

### Journey: Set up fixed costs and limits
1. Create a recurring expense (e.g. rent, Living cost, on day 1 of each month).
2. Set a monthly budget for each category.
3. In following months the recurring expense appears automatically and counts against the budget.

### Journey: Take data out
1. Click "Export CSV" and receive a file with every expense.

- **US-01**: As the user, I want to add an expense with amount, category, date and note so that every spend is recorded. → REQ-001, REQ-002, REQ-013
- **US-02**: As the user, I want to correct or remove an expense so that my records stay accurate. → REQ-003, REQ-004
- **US-03**: As the user, I want to browse expenses by month and category so that I can find a specific spend. → REQ-005
- **US-04**: As the user, I want monthly totals per category with a chart so that I see where my money goes. → REQ-006, REQ-007
- **US-05**: As the user, I want a monthly budget per category and to see what is left so that I avoid overspending. → REQ-008, REQ-009
- **US-06**: As the user, I want repeating costs added automatically so that I don't re-enter rent or tuition every month. → REQ-010, REQ-011
- **US-07**: As the user, I want to export my expenses to CSV so that I can use them in a spreadsheet. → REQ-012
- **US-08**: As the user, I want my data kept between visits without an account so that tracking is private and effortless. → REQ-014, REQ-016

## 5. Functional requirements
### REQ-001: Add an expense  ·  Must
The user can create an expense with amount (required, > 0, up to 2 decimals), category (required, one of the fixed categories), date (required, defaults to today) and note (optional, ≤ 200 characters).

**Acceptance criteria**
- Given the add form, when the user enters amount `12.50`, category Food and saves, then an expense dated today with amount 12.50 and category Food appears in the current month's list.
- Given the add form, when the amount is empty, `0`, negative or has more than 2 decimals, then saving is blocked and an inline error is shown next to the amount field.
- Given the add form, when no category is selected, then saving is blocked and an inline error is shown.

### REQ-002: Fixed expense categories  ·  Must
The app provides exactly five categories: Food, Education, Charity, Sport, Living cost. Each has a distinct colour and icon used consistently across the app.

**Acceptance criteria**
- Given the add form, when the user opens the category picker, then exactly the five categories are offered, in the order Food, Education, Charity, Sport, Living cost.
- Given any list, summary or chart, when a category is shown, then it uses the same colour and label everywhere.

### REQ-003: Edit an expense  ·  Must
The user can change any field of an existing expense.

**Acceptance criteria**
- Given an expense of 10.00 Food, when the user edits it to 15.00 Sport and saves, then the list shows 15.00 Sport and the monthly totals for Food decrease by 10.00 and Sport increase by 15.00.
- Given the edit form, when invalid values are entered, then the same validation as REQ-001 applies.

### REQ-004: Delete an expense  ·  Must
The user can delete an expense after confirming.

**Acceptance criteria**
- Given an expense, when the user chooses delete, then a confirmation is shown; on confirm the expense disappears from the list and totals; on cancel nothing changes.

### REQ-005: Monthly expense list with navigation and filter  ·  Must
The home screen shows the expenses of a selected month (default: current month), newest date first. The user can move to the previous/next month and filter by one category.

**Acceptance criteria**
- Given expenses in October and September, when the user is on October and taps "previous month", then only September's expenses are listed, sorted by date descending.
- Given the October list, when the user filters by Education, then only Education expenses of October are shown, and clearing the filter shows all again.
- Given a month with no expenses, when it is shown, then an empty state with an "Add expense" action is displayed.

### REQ-006: Monthly summary per category  ·  Must
For the selected month the app shows the total spent and the total per category (all five categories, including those at 0).

**Acceptance criteria**
- Given October expenses Food 10.00, Food 5.00 and Sport 20.00, when the user opens the October summary, then it shows Food 15.00, Sport 20.00, Education 0.00, Charity 0.00, Living cost 0.00 and total 35.00.

### REQ-007: Monthly spending chart  ·  Must
The summary includes a chart showing each category's share of the month's spending.

**Acceptance criteria**
- Given the October summary from REQ-006, when the chart renders, then it shows Food and Sport segments proportional to 15.00 and 20.00, each labelled with category and amount.
- Given a month with no expenses, when the summary is shown, then the chart is replaced by an empty-state message.

### REQ-008: Monthly budget per category  ·  Must
The user can set, change or clear a monthly budget amount for each category. A budget applies to every month until changed.

**Acceptance criteria**
- Given the budgets screen, when the user sets Food = 300.00 and saves, then Food shows a 300.00 budget in the current month and all later months.
- Given a budget, when the user clears it, then that category shows "No budget" and no progress indicator.
- Given the budget field, when a non-positive or non-numeric value is entered, then saving is blocked with an inline error.

### REQ-009: Budget status  ·  Must
For each category with a budget, the summary shows spent, remaining (or over by) and a progress bar for the selected month. Categories at ≥ 80% of budget show a warning state; over 100% show an over-budget state.

**Acceptance criteria**
- Given Food budget 300.00 and Food spending 120.00 in October, then the October summary shows "180.00 left" and a 40% progress bar in the normal state.
- Given Food spending 250.00, then the bar is at 83% in the warning state.
- Given Food spending 330.00, then the summary shows "30.00 over" in the over-budget state.

### REQ-010: Recurring expenses  ·  Must
The user can define a recurring expense (amount, category, note, day of month 1–31, start month). When the app is opened, it creates the expense for every due month from the start month up to the current month that has not been created yet. If the day exceeds the month's length, the last day of the month is used. Generated expenses are normal expenses (editable/deletable) and are marked as recurring.

**Acceptance criteria**
- Given a recurring "Rent" 500.00 Living cost on day 1 starting August, when the user opens the app on 28 October for the first time since creating it, then exactly three expenses exist (1 Aug, 1 Sep, 1 Oct), each 500.00 Living cost marked as recurring.
- Given those expenses exist, when the app is opened again, then no duplicates are created.
- Given a recurring expense on day 31, when February is generated, then the expense is dated the last day of February.
- Given a generated expense that the user deleted, when the app is reopened, then it is not recreated.

### REQ-011: Manage recurring expenses  ·  Must
The user can list, edit and stop recurring expenses. Edits apply to future generated expenses only; stopping prevents future generation; already-created expenses are not changed.

**Acceptance criteria**
- Given "Rent" recurring 500.00, when the user edits it to 550.00 in October, then the November expense is created at 550.00 and the October expense stays 500.00.
- Given "Rent" recurring, when the user stops it, then no expense is created for following months and existing ones remain.

### REQ-012: Export to CSV  ·  Must
The user can download all expenses as a CSV file with header `date,category,amount,note,recurring`, dates in `YYYY-MM-DD`, amounts with 2 decimals, UTF-8 encoded, properly quoting commas, quotes and new lines in notes.

**Acceptance criteria**
- Given 3 expenses, when the user clicks "Export CSV", then a file named `expenses-YYYY-MM-DD.csv` downloads containing the header and exactly 3 data rows sorted by date ascending.
- Given a note `Lunch, "big" one`, when exported, then the field is written as `"Lunch, ""big"" one"` and the file opens correctly in a spreadsheet app.
- Given no expenses, when the user clicks "Export CSV", then a file with only the header is downloaded.

### REQ-013: Currency setting  ·  Must
The user picks one currency (ISO code, e.g. VND, USD, EUR) in settings; all amounts are displayed with that currency's symbol and formatting. Changing it changes display only, not stored values.

**Acceptance criteria**
- Given currency USD, when an expense of 12.5 is shown, then it displays as `$12.50`.
- Given currency VND, when an expense of 50000 is shown, then it displays as `50.000 ₫` (locale formatting, no decimals).
- Given first launch, when no currency has been chosen, then a default (USD) is used and can be changed in settings.

### REQ-014: Local persistence  ·  Must
All data (expenses, budgets, recurring expenses, settings) is stored in the browser on the user's device and survives page reloads and browser restarts. No account is needed.

**Acceptance criteria**
- Given 5 saved expenses, when the user closes and reopens the browser, then the same 5 expenses, budgets, recurring items and currency are shown.

## 6. Non-functional requirements
### REQ-015: Performance  ·  Must
**Acceptance criteria**
- With 5,000 stored expenses, the month list and summary render in < 1 s after opening the app on a mid-range laptop.
- Saving an expense updates the list and totals in < 200 ms.

### REQ-016: Privacy & offline  ·  Must
**Acceptance criteria**
- No expense data is sent over the network: a network log while adding, editing, viewing and exporting shows zero requests carrying user data.
- After the first load, the app works fully with the network disabled.

### REQ-017: Responsive layout  ·  Must
**Acceptance criteria**
- At 360 px viewport width every screen is usable without horizontal scrolling; at ≥ 1024 px the layout uses the extra width (e.g. list and summary side by side).

### REQ-018: Accessibility  ·  Should
**Acceptance criteria**
- All actions are reachable by keyboard with a visible focus indicator.
- All form fields have labels; text and category colours meet WCAG 2.1 AA contrast; categories are never distinguished by colour alone (label or icon also shown).
- An automated axe scan of each screen reports zero serious or critical issues.

### REQ-019: Money accuracy  ·  Must
**Acceptance criteria**
- Amounts are stored as integer minor units (e.g. cents), so adding 0.10 + 0.20 shows 0.30 exactly in totals.
- Totals for a month always equal the sum of that month's listed expenses.

## 7. Out of scope (v1)
- User accounts, login, cloud sync or multi-device sync
- Multiple currencies or currency conversion
- Custom / user-defined categories or sub-categories
- Income tracking, savings goals, net balance
- Bank or card import, receipt scanning
- CSV import, JSON backup/restore
- Yearly reports and multi-month trend charts
- Notifications or reminders
- Native mobile or desktop apps (the web app is used in a mobile browser instead)

## 8. Assumptions
- Single user on a single device/browser; clearing browser data deletes the data (CSV export is the backup path).
- The five categories are fixed; "Living cost" covers rent, utilities, transport and other household costs.
- One currency for all data; default USD, changeable in settings. Amounts allow up to 2 decimals (currencies with 0 decimals, like VND, display without decimals).
- Budgets are the same every month (no per-month overrides) and reset each calendar month.
- Recurring expenses are monthly only (no weekly/yearly) and are generated when the app is opened, not in the background.
- Months follow the device's local time zone and calendar months.

## 9. Open questions
- (none blocking)

## 10. Revision history
| Date | Change |
|---|---|
| 2026-10-28 | Initial draft. Platform: web app; must-haves: monthly summaries, budgets, recurring expenses, CSV export; single currency. |
