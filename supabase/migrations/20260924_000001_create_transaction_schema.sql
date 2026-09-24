BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  name text NOT NULL,
  UNIQUE (clerk_user_id, id),
  UNIQUE (clerk_user_id, name),
  CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  name text NOT NULL,
  UNIQUE (clerk_user_id, id),
  UNIQUE (clerk_user_id, name),
  CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL,
  payment_method_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  CHECK (amount > 0),
  CHECK (length(trim(description)) > 0),
  CONSTRAINT transactions_category_fk
    FOREIGN KEY (clerk_user_id, category_id)
    REFERENCES public.categories (clerk_user_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT transactions_payment_method_fk
    FOREIGN KEY (clerk_user_id, payment_method_id)
    REFERENCES public.payment_methods (clerk_user_id, id)
    ON DELETE RESTRICT
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.categories FROM anon, authenticated;
REVOKE ALL ON TABLE public.payment_methods FROM anon, authenticated;
REVOKE ALL ON TABLE public.transactions FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_categories_clerk_user_id_name
  ON public.categories (clerk_user_id, name);

CREATE INDEX IF NOT EXISTS idx_payment_methods_clerk_user_id_name
  ON public.payment_methods (clerk_user_id, name);

CREATE INDEX IF NOT EXISTS idx_transactions_clerk_user_id_date
  ON public.transactions (clerk_user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_clerk_user_id_category_id
  ON public.transactions (clerk_user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_transactions_clerk_user_id_payment_method_id
  ON public.transactions (clerk_user_id, payment_method_id);

CREATE POLICY "categories_select_own"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "categories_insert_own"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "categories_update_own"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "categories_delete_own"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "payment_methods_select_own"
  ON public.payment_methods
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "payment_methods_insert_own"
  ON public.payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "payment_methods_update_own"
  ON public.payment_methods
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "payment_methods_delete_own"
  ON public.payment_methods
  FOR DELETE
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "transactions_select_own"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "transactions_insert_own"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "transactions_update_own"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "transactions_delete_own"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

COMMIT;
