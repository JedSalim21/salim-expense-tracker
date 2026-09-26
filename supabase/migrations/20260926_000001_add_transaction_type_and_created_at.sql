BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.transactions) THEN
    RAISE EXCEPTION 'Transactions already exist; backfill type before applying this migration';
  END IF;
END;
$$;

ALTER TABLE public.transactions
  ADD COLUMN type text NOT NULL
    CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense')),
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

COMMIT;