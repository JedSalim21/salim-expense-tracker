# Task 006 — App Structure & Tailwind UI Refactor

**Status:** IMPLEMENTED

## Goal

Refactor the current SalimSpend frontend so the main application structure is easier to maintain without changing behavior.

## Approved Approach

Use the recommended Option 1 pattern for the app structure:

- keep the authenticated shell and local view switching in the root app
- move page-specific UI into page components
- extract shared layout elements into reusable components
- continue using Tailwind as the primary styling system
- keep the product behavior and design language stable

This preserves the existing single-page architecture instead of introducing router-level page management.

## Structural Decision

The app remains structured around a lightweight state-driven view switcher rather than route-based navigation.

Conceptually:

```text
App
├── Clerk auth shell
├── activeView state
├── Dashboard page
└── Transactions page
```

This keeps the app simple and aligns with the current single-screen product direction while making the code easier to follow.

## Refactor Scope

The refactor includes:

- reducing the responsibilities of `App.jsx`
- moving dashboard UI into `src/pages/Dashboard.jsx`
- moving transaction UI into `src/pages/TransactionsPage.jsx`
- extracting the shared sidebar into `src/components/SidebarNav.jsx`
- preserving the existing Clerk sign-in/sign-out flow
- preserving the current responsive layout and styling conventions

## Out of Scope

Do not implement:

- new backend features
- database changes
- authentication redesign
- router introduction
- UI redesign
- business logic changes

## Implementation Result

The refactor was completed with the architecture kept intentionally minimal.

The root app now handles only:

- Clerk loading state
- signed-out auth screen
- signed-in app shell
- local view switching

The screen-specific content lives in dedicated files, making the code easier to read and extend without altering behavior.

## Files Updated

- `src/App.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/TransactionsPage.jsx`
- `src/components/SidebarNav.jsx`
- `agent-review.md`

## Documentation Transparency

This task document was added to record the implemented refactor and the approved Option 1 app structure.

It reflects the current production state of the app and documents the architectural decision to keep the view-switching approach local and lightweight.
