# Task 016 — Currency Integration

## Status

**IMPLEMENTED**

## Goal

Use the currency preference already persisted by Settings when displaying
monetary values throughout the existing application, without converting or
changing stored amounts.

## Implementation

- Added a shared formatter using `Intl.NumberFormat` with the selected currency,
  narrow currency symbols, and each currency's standard fraction digits.
- Passed the current Settings currency to the Dashboard, Transactions, and
  Reports pages. The Dashboard continues to use its existing static mock data;
  it was not connected to Supabase.
- Updated Transactions monetary values, Reports summaries, category amounts,
  top-category amounts, and insight text to format at presentation time.
- Kept transaction amounts and report calculations numeric. Transaction
  creation, editing, deletion, database schema, and Settings persistence were
  not changed.
- Preserved the existing Reset All Data behavior.

## Files Updated

- `src/App.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/TransactionsPage.jsx`
- `src/pages/ReportsPage.jsx`
- `src/lib/currency.js`
- `src/lib/currency.test.js`
- `src/lib/reports.js`
- `src/lib/reports.test.js`
- `docs/tasks/task-016-currency-integration.md`
- `agent-review.md`

## Verification

- `node --test src/lib/currency.test.js src/lib/reports.test.js src/lib/settings.test.js` passed: 9 tests.
- `npm run lint` passed.
- `npm run build` passed. Vite reported its existing large-chunk advisory.
- Currency symbols, positive/negative formatting, JPY fraction digits, invalid
  values, and report insight formatting are covered by automated tests.
- Live authenticated UI checks for changing currency, navigating, refreshing,
  and transaction CRUD were not performed in this environment. The existing
  persistence code and transaction mutation paths were left unchanged.

## Human Review

Implementation is complete. Human review and acceptance remain pending; this
record does not mark the task accepted.
