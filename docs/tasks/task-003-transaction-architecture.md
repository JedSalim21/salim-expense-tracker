# Task 003 — Transaction Architecture

**Status:** APPROVED

## Goal

Define the data architecture for SalimSpend transactions before database implementation.

The architecture must support authenticated user ownership, custom categories, custom payment methods, and editable transaction dates.

## Requirements

### Transaction

Each transaction must contain:

- `id`
- `user_id`
- `amount`
- `description`
- `category_id`
- `payment_method_id`
- `date`

Rules:

- Amount must be greater than `0`
- Description is required
- Category is required
- Payment method is required
- Date defaults to today but must be editable
- Every transaction belongs to exactly one authenticated user

### Category

Each category must contain:

- `id`
- `user_id`
- `name`

Rules:

- Default categories are seeded separately for each user
- Users can create custom categories
- Users can edit/rename their categories
- A category cannot be deleted while existing transactions reference it

### Payment Method

Each payment method must contain:

- `id`
- `user_id`
- `name`

Rules:

- Default payment methods are seeded separately for each user
- Users can create custom payment methods
- Users can edit/rename their payment methods
- A payment method cannot be deleted while existing transactions reference it

## Ownership

All user-specific records must belong to the authenticated user.

Conceptually:

```text
User
├── Transactions
├── Categories
└── Payment Methods
```

A transaction belongs to exactly one user.

Categories and payment methods also belong to exactly one user.

User ownership must eventually be enforced at the database/API authorization level, not only through client-side filtering.

## Relationships

```text
User
 │
 ├── 1:N → Transactions
 │
 ├── 1:N → Categories
 │
 └── 1:N → Payment Methods

Transaction
 ├── N:1 → Category
 └── N:1 → Payment Method
```

Transactions should reference categories and payment methods by ID rather than storing their names directly.

## Default Data

When a new user is created:

1. Create the user's account/identity.
2. Seed the default categories for that user.
3. Seed the default payment methods for that user.

The exact default category and payment-method lists may be defined during database implementation.

## Date Behavior

The transaction date represents the date the expense occurred.

The UI should default the date to today.

The user must be able to change the date before saving the transaction.

A separate `created_at` timestamp may be introduced later if needed for system/audit purposes. It should not replace the transaction's expense date.

## Delete Behavior

Categories and payment methods must not be deleted when existing transactions reference them.

Editing/renaming is allowed.

Example:

```text
Food → Meals
```

This changes the existing category name while keeping the same category identity and existing transaction references.

## Out of Scope

This task defines architecture only.

Do not implement:

- Supabase tables
- Supabase migrations
- Row Level Security (RLS)
- Transaction CRUD
- Category CRUD
- Payment method CRUD
- Dashboard functionality
- Reports
- Budgets
- Financial calculations
- Authentication changes
- UI redesign

## Implementation Guidance

The implementation must follow this approved architecture.

Do not introduce significant architectural changes without human review and approval.

If an important implementation detail is missing or ambiguous, stop and ask for human clarification rather than making a major architectural decision silently.

## Documentation Transparency

If any `.md` documentation file is created or modified during implementation, explicitly report:

- Which `.md` file changed
- What changed
- Why it changed
- The impact of the change

The documentation change must be reviewed and approved by the human before it is considered accepted or committed.

## Human Decision

**APPROVED**

Transaction Architecture is approved for implementation.
