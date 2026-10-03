# Task 021 — Activity Period Sync for Cash Flow & Spend Trend

## Status

**IMPLEMENTED**

## Goal

Keep the Dashboard and Reports activity charts synchronized with the active date/activity period so the chart data, labels, and range update when the user switches between day, week, month, and year views.

## Implementation

- Added period-aware chart aggregation in `src/lib/reports.js` so the dashboard and reports trend data are built from the currently selected activity period instead of stale static/monthly defaults.
- Updated the Dashboard Cash Flow chart to read the period-specific series from the real transaction data and refresh its labels and values as the period changes.
- Updated the Reports Spend Trend chart heading and view label to match the selected period and keep the chart data aligned with the active period selector.
- Kept the existing user-local timezone behavior from Task 020 intact while rebuilding the chart buckets around the browser's current date context.

## Files Updated

- `src/lib/reports.js`
- `src/lib/reports.test.js`
- `src/pages/Dashboard.jsx`
- `src/pages/ReportsPage.jsx`
- `docs/tasks/task-021-activity-period-sync.md`

## Verification

- `node --test src/lib/*.test.js`
- `npx eslint src/pages/Dashboard.jsx src/pages/ReportsPage.jsx src/lib/reports.js src/lib/reports.test.js`
- `npx vite build`

## Notes

This keeps the existing UI and chart design intact while fixing the stale data flow. The selected activity period is now the source of truth for the affected chart series, and the chart range updates appropriately when the user changes between day, week, month, and year periods.
