# Supabase RLS test files

This directory contains schema and ownership tests for the transaction data foundation.

## Included test files

- `transaction_rls.test.sql`

## Status

These tests are prepared for execution in a local Supabase environment with Docker/Podman available.

## Important note

The tests have not been executed in the current environment because a local Supabase/Postgres runtime is unavailable here.

The tests should be run in a working local Supabase environment using the Supabase CLI:

```bash
supabase start
supabase test db
```

## Documentation transparency

This file was created to document the test preparation status and the current execution limitation.

The change is limited to architecture review and validation support; it does not implement database behavior or modify the approved migration architecture.
