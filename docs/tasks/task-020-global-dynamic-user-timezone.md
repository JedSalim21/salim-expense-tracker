# Task 020 — Global Dynamic User Timezone

## Status

**IMPLEMENTED**

## Goal

Align SalimSpend's date and time behavior with the user's local browser/device timezone so dashboard, transaction, and reporting logic reflects the user's current calendar rather than fixed or server-dependent assumptions.

## Implementation

- Added a reusable timezone helper in `src/lib/timezone.js` that reads the active browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` and formats dates using that timezone.
- Updated the dashboard greeting and date header to render using the user's local date and time instead of a static date string.
- Updated transaction date formatting and picker display to render local calendar values consistently in the user's timezone.
- Kept report period calculations grounded in local date boundaries and ensured monthly labels are formatted using the browser timezone.
- Avoided hardcoded timezone assumptions or a manual timezone selector, while preserving existing transaction timestamps and stored data.

## Files Updated

- `src/lib/timezone.js`
- `src/lib/reports.js`
- `src/pages/Dashboard.jsx`
- `src/pages/TransactionsPage.jsx`
- `docs/tasks/task-020-global-dynamic-user-timezone.md`

## Verification

- `TZ=America/Los_Angeles node --test src/lib/*.test.js`
- `TZ=Asia/Tokyo node --test src/lib/*.test.js`
- `npm run build`

## Notes

This task keeps the application timezone-aware without changing the database schema, authentication flow, or any user-facing design beyond switching static date labels to the active local timezone.
