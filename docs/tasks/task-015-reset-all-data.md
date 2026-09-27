# Task 015 — Reset All Data

## Status

**IMPLEMENTED**

## Goal

Allow an authenticated user to permanently clear their SalimSpend application
data without deleting their Clerk account, ending their session, or affecting
another user's data.

## Data Scope and Ownership

The current database contains three user-owned tables: `transactions`,
`categories`, and `payment_methods`. Each table uses `clerk_user_id`; existing
RLS policies compare that value with the authenticated JWT `sub`. Transactions
have restrictive foreign keys to both categories and payment methods. There
are no persisted preferences/settings tables in the current migrations;
browser-local SalimSpend preferences are also reset after the database operation
succeeds.

## Implementation

- Added `public.reset_user_data()` as an authenticated, invoker-security
  PostgreSQL function. It obtains ownership from `auth.jwt() ->> 'sub'`, accepts
  no user ID from the client, and deletes transactions before categories and
  payment methods.
- The function runs as one RPC statement, so PostgreSQL rolls back the database
  deletes together if the operation fails. It retains the existing RLS boundary
  and does not use elevated credentials or change schema relationships.
- Settings requires explicit confirmation that describes the permanent data
  deletion and clarifies that the Clerk account remains. It shows pending,
  success, and generic error feedback.
- After success, browser-local SalimSpend preferences return to defaults. The
  authenticated session remains active.
- Existing category and payment-method loaders recreate their default rows
  when the corresponding connected views are opened. Transactions and Reports
  reload from Supabase when opened and reflect the absence of transactions.
  Dashboard remains out of scope and was not changed.

## Files Updated

- `src/App.jsx`
- `src/pages/SettingsPage.jsx`
- `supabase/migrations/20260927_000001_reset_user_data.sql`
- `supabase/tests/reset_user_data.test.sql`
- `supabase/tests/README.md`
- `docs/tasks/task-015-reset-all-data.md`
- `agent-review.md`

## Verification

- `npm run lint` passed after the Settings integration.
- `npm run build` passed; Vite emitted a chunk-size advisory that did not fail the build.
- SQL tests and live authenticated UI/data verification were not run. The
  Supabase CLI is unavailable in this environment, and no configured live
  Supabase test session was used.

## Documentation Transparency

This task record documents the current data model, ownership and deletion
strategy, user-facing reset flow, and checks actually performed. Human review
and acceptance remain required before commit or push.
