# Task 004 — Database Schema & Ownership

**Status:**APPROVED

## Source of truth

This proposal is based on the approved transaction architecture in [docs/tasks/task-003-transaction-architecture.md](docs/tasks/task-003-transaction-architecture.md), together with the product requirements in [overview.md](overview.md) and [spec.md](spec.md).

Task 003 approved the requirement that user-owned records belong to exactly one authenticated user and that user ownership must eventually be enforced at the database/API layer.

This Task 004 proposal refines the identity model specifically for the approved Clerk + Supabase Third-Party Auth architecture.

## Final ownership model

SalimSpend will use Clerk as the authentication provider and Supabase will trust Clerk-issued session JWTs via Supabase Third-Party Auth.

The stable authenticated user identity for ownership enforcement is the Clerk JWT subject claim (`sub`).

The database model therefore uses a `clerk_user_id` ownership key on all user-owned tables rather than assuming that `auth.uid()` or a separate `profiles.id` equals the Clerk user identifier.

This preserves the original Task 003 requirement that each transaction, category, and payment method belongs to exactly one authenticated user, while aligning the implementation with the official Clerk Third-Party Auth integration model.

## Identity rule

- Clerk authenticates the user.
- Clerk session JWT is the source of authenticated user identity.
- Supabase validates the Clerk JWT as a third-party auth token.
- RLS ownership checks use the authenticated Clerk JWT identity, specifically the stable `sub` claim.
- The database stores `clerk_user_id` on user-owned records.

Important:

- `auth.uid()` is not assumed to equal the Clerk user ID.
- `profiles.id = auth.uid()` is not used in this model.
- `clerk_user_id` is the ownership key for user-scoped records.

## Proposed tables

### `transactions`

| Column              | Type            | Notes                                                      |
| ------------------- | --------------- | ---------------------------------------------------------- |
| `id`                | `uuid`          | PK                                                         |
| `clerk_user_id`     | `text`          | required; stable Clerk subject (`sub`) for the owning user |
| `amount`            | `numeric(12,2)` | required; must be > 0                                      |
| `description`       | `text`          | required                                                   |
| `category_id`       | `uuid`          | FK to `categories.id`                                      |
| `payment_method_id` | `uuid`          | FK to `payment_methods.id`                                 |
| `date`              | `date`          | required; transaction date                                 |

### `categories`

| Column          | Type   | Notes                                                    |
| --------------- | ------ | -------------------------------------------------------- |
| `id`            | `uuid` | PK                                                       |
| `clerk_user_id` | `text` | required; ownership key for the authenticated Clerk user |
| `name`          | `text` | required; user-scoped category name                      |

### `payment_methods`

| Column          | Type   | Notes                                                    |
| --------------- | ------ | -------------------------------------------------------- |
| `id`            | `uuid` | PK                                                       |
| `clerk_user_id` | `text` | required; ownership key for the authenticated Clerk user |
| `name`          | `text` | required; user-scoped payment method name                |

## Relationships and ownership

Conceptually:

```text
Clerk user
  └── owns
      ├── Transactions
      ├── Categories
      └── Payment Methods
```

Each transaction belongs to exactly one authenticated Clerk user.

Categories and payment methods also belong to exactly one authenticated Clerk user.

Requirements from Task 003 remain unchanged:

- transactions reference categories and payment methods by ID, not by name
- categories and payment methods are user-scoped and do not become global shared values
- a category or payment method cannot be deleted while transactions still reference it

## Clerk-to-database ownership mapping

The ownership model uses Clerk's stable subject claim (`sub`) as the row-level ownership identity.

The mapping is:

```text
Clerk session JWT `sub` -> row.clerk_user_id
```

This is the identity used by RLS.

## RLS strategy

RLS must enforce ownership using the authenticated Clerk JWT identity, specifically the stable `sub` claim.

Conceptually:

```sql
row.clerk_user_id = auth.jwt() ->> 'sub'
```

This allows the database to enforce:

- a user can only read their own transactions
- a user can only insert transactions belonging to themselves
- a user can only update their own transactions
- a user can only delete their own transactions
- the same rules apply to categories and payment methods

## Constraints and validation

Database constraints should enforce:

- `amount > 0`
- required fields for transaction description, category, payment method, and date
- valid foreign-key references between transactions and categories/payment methods
- no delete of a category or payment method that is still referenced by one or more transactions

## Indexes

Useful indexes for the expected query patterns include:

- `transactions (clerk_user_id, date desc)`
- `transactions (clerk_user_id, category_id)`
- `transactions (clerk_user_id, payment_method_id)`
- `categories (clerk_user_id, name)`
- `payment_methods (clerk_user_id, name)`

These support the expected user-scoped reads and ownership filtering without over-indexing unrelated fields.

## Default data seeding strategy

When a new authenticated Clerk user is created:

1. the user authenticates via Clerk
2. the app creates the user-specific default categories for that Clerk user
3. the app creates the user-specific default payment methods for that Clerk user
4. user-created custom categories/payment methods are added with the same `clerk_user_id`

Default lists remain user-scoped and are not global/shared.

## Deployment and migration considerations

- This is a design proposal only.
- No database tables, migrations, policies, or CRUD implementation will be created yet.
- The final schema and RLS policies should be validated in a human-reviewed migration plan before production deployment.
- The policy logic must be verified against the actual Clerk JWT claims used in the provider configuration.

## Out of scope for Task 004

The following remain out of scope for this task:

- actual table creation
- migrations
- RLS policy implementation
- CRUD operation implementation
- dashboard features
- reports or budgets
- financial calculations
- authentication flow changes beyond the approved Clerk Third-Party Auth integration model
- UI redesign or app behavior changes

## Human review gate

This architecture remains subject to human approval before any database implementation begins.

No table creation, migration, policy creation, or database implementation should proceed until this documentation is reviewed and approved.
