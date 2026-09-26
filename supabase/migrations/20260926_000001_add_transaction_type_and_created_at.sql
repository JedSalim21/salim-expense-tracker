BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'type'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.transactions) THEN
      RAISE EXCEPTION 'Transactions exist without a type column; classify them before applying this migration';
    END IF;

    ALTER TABLE public.transactions ADD COLUMN type text;
  END IF;

  IF EXISTS (SELECT 1 FROM public.transactions WHERE type IS NULL) THEN
    RAISE EXCEPTION 'Transactions have NULL type values; classify them before enforcing NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.transactions
    WHERE type NOT IN ('income', 'expense')
  ) THEN
    RAISE EXCEPTION 'Transactions have invalid type values; resolve them before applying this migration';
  END IF;
END;
$$;

ALTER TABLE public.transactions
  ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND conname = 'transactions_type_check'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_type_check
      CHECK (type IN ('income', 'expense'));
  END IF;
END;
$$;

-- Existing rows receive the migration-time timestamp, not their historical creation time.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

COMMIT;