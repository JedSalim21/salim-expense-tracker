# Task 012 — Connect Reports

## Status

**IMPLEMENTED**

## Goal

Connect the existing Reports screen to the authenticated user's transaction data so the page reflects real income, expense, category, and monthly trend metrics while preserving the project's Clerk + Supabase ownership structure.

## Approved Approach

This task follows the same architecture used by the current transaction workflow:

- Clerk remains the identity source.
- Supabase is initialized with the Clerk access-token callback.
- Report calculations read the authenticated user's transactions only.
- Category names are loaded from the existing owned category table.
- Report calculations are driven by real transaction data rather than static mock content.
- The UI keeps its existing design and behavior while replacing placeholder values with live data.

## Scope

The implementation includes:

- loading the authenticated user's real transactions from Supabase
- loading the user's owned categories for expense grouping
- computing current-month income, expenses, net cash flow, and savings rate from real data
- computing monthly trend and category breakdowns from transaction records
- rendering loading, empty, and error states on the Reports page
- preserving the current Reports UI structure while replacing mock values with live values
- keeping all access within the established Clerk + Postgres RLS ownership model

## Out of Scope

This task does not include:

- redesigning the Reports screen
- adding new report types or analytics features
- changing the database schema or RLS model
- introducing a second Supabase client or ownership mechanism
- modifying the transaction edit/create flow beyond what is required for data retrieval
- unrelated refactoring or UI cleanup

## Implementation Result

The Reports page is now connected to real transaction data and calculates the displayed values from the authenticated user's transactions. The page reads only user-owned rows via the existing Supabase client configuration and renders data-driven summaries, category breakdowns, quick insights, and a 6-month trend view instead of static demo numbers.

It also handles the expected states:

- loading while the data is being fetched
- empty data when no transactions exist yet
- error cases when the request fails
- a real category breakdown derived from real expense records

## Critical Behavior

The implementation preserves the user ownership model already established by Tasks 010 and 011:

```text
Clerk session
  ↓
Clerk access token
  ↓
Supabase client created with getToken
  ↓
PostgreSQL RLS using auth.jwt() ->> 'sub'
  ↓
User-owned transaction rows only
```

The Reports page does not trust client-side ownership values and does not bypass database-level access checks.

## Files Updated

- `src/pages/ReportsPage.jsx`
- `src/lib/reports.js`
- `src/lib/reports.test.js`
- `docs/tasks/task-012-connect-reports.md`

## Verification

The following checks were run successfully:

- `npm run lint`
- `npm run build`
- `node --test src/lib/reports.test.js`

All three completed successfully after the implementation.

## Documentation Transparency

This task document records the final implementation of Task 012 and documents the actual connected data flow, verification steps, and user-ownership boundary that the Reports page now uses.
