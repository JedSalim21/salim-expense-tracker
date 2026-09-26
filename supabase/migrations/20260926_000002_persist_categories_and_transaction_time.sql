BEGIN;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#0f766e',
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz;

UPDATE public.categories
SET
  description = CASE name
    WHEN 'Food' THEN 'Groceries, dining, and everyday meals.'
    WHEN 'Housing' THEN 'Rent, utilities, and home essentials.'
    WHEN 'Lifestyle' THEN 'Entertainment, wellness, and personal spending.'
    WHEN 'Transport' THEN 'Fuel, transit, and commuting costs.'
  END,
  color = CASE name
    WHEN 'Food' THEN '#d97706'
    WHEN 'Housing' THEN '#0f766e'
    WHEN 'Lifestyle' THEN '#be185d'
    WHEN 'Transport' THEN '#2563eb'
  END,
  is_default = true
WHERE name IN ('Food', 'Housing', 'Lifestyle', 'Transport');

COMMIT;