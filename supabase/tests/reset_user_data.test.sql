BEGIN;
SELECT plan(5);

INSERT INTO public.categories (id, clerk_user_id, name)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'reset-user-a', 'Food'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'reset-user-b', 'Travel');

INSERT INTO public.payment_methods (id, clerk_user_id, name)
VALUES
  ('33333333-3333-3333-3333-333333333333'::uuid, 'reset-user-a', 'Cash'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'reset-user-b', 'Card');

INSERT INTO public.transactions (
  id, clerk_user_id, amount, type, description, category_id, payment_method_id
)
VALUES
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'reset-user-a', 25.50, 'expense', 'Lunch',
    '11111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
  ),
  (
    '66666666-6666-6666-6666-666666666666'::uuid,
    'reset-user-b', 120.00, 'income', 'Refund',
    '22222222-2222-2222-2222-222222222222'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid
  );

SET LOCAL request.jwt.claim.sub = 'reset-user-a';
SET LOCAL role authenticated;

SELECT lives_ok(
  $$SELECT public.reset_user_data()$$,
  'authenticated user can reset their application data with related transactions'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.transactions$$,
  ARRAY[0],
  'reset removes the authenticated user transactions first'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.categories$$,
  ARRAY[0],
  'reset removes the authenticated user categories'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.payment_methods$$,
  ARRAY[0],
  'reset removes the authenticated user payment methods'
);

RESET ROLE;

SELECT results_eq(
  $$SELECT count(*)::int FROM (
    SELECT id FROM public.transactions WHERE clerk_user_id = 'reset-user-b'
    UNION ALL
    SELECT id FROM public.categories WHERE clerk_user_id = 'reset-user-b'
    UNION ALL
    SELECT id FROM public.payment_methods WHERE clerk_user_id = 'reset-user-b'
  ) AS other_user_rows$$,
  ARRAY[3],
  'reset preserves all other users application data'
);

SELECT * FROM finish();
ROLLBACK;