begin;
select plan(36);

-- Seed both users before switching to the restricted application role.
insert into public.categories (id, clerk_user_id, name)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'clerk-user-a', 'Food'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'clerk-user-b', 'Travel');

insert into public.payment_methods (id, clerk_user_id, name)
values
  ('33333333-3333-3333-3333-333333333333'::uuid, 'clerk-user-a', 'Cash'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'clerk-user-b', 'Credit Card');

insert into public.transactions (
  id, clerk_user_id, amount, type, description, category_id, payment_method_id
)
values
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'clerk-user-a',
    25.50,
    'expense',
    'Bakery',
    '11111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
  ),
  (
    '66666666-6666-6666-6666-666666666666'::uuid,
    'clerk-user-b',
    120.00,
    'income',
    'Refund',
    '22222222-2222-2222-2222-222222222222'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid
  );

set local request.jwt.claim.sub = 'clerk-user-a';
set local role authenticated;

select results_eq(
  $$select count(*)::int from public.categories where clerk_user_id = 'clerk-user-a'$$,
  array[1],
  'owner can read own categories'
);

select results_eq(
  $$select count(*)::int from public.payment_methods where clerk_user_id = 'clerk-user-a'$$,
  array[1],
  'owner can read own payment methods'
);

select results_eq(
  $$select count(*)::int from public.transactions$$,
  array[1],
  'owner can read own transactions only'
);

select results_eq(
  $$insert into public.categories (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Utilities') returning name$$,
  array['Utilities'],
  'owner can insert own category'
);

select results_eq(
  $$update public.categories set name = 'Meals' where clerk_user_id = 'clerk-user-a' and name = 'Food' returning name$$,
  array['Meals'],
  'owner can update own category'
);

select results_eq(
  $$delete from public.categories where clerk_user_id = 'clerk-user-a' and name = 'Meals' returning name$$,
  array['Meals'],
  'owner can delete own category'
);

select results_eq(
  $$insert into public.payment_methods (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Debit Card') returning name$$,
  array['Debit Card'],
  'owner can insert own payment method'
);

select results_eq(
  $$update public.payment_methods set name = 'Bank Card' where clerk_user_id = 'clerk-user-a' and name = 'Debit Card' returning name$$,
  array['Bank Card'],
  'owner can update own payment method'
);

select results_eq(
  $$delete from public.payment_methods where clerk_user_id = 'clerk-user-a' and name = 'Bank Card' returning name$$,
  array['Bank Card'],
  'owner can delete own payment method'
);

select results_eq(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      '77777777-7777-7777-7777-777777777777'::uuid,
      'clerk-user-a',
      8.25,
      'expense',
      'Coffee',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    ) returning description || ':' || type$$,
  array['Coffee:expense'],
  'owner can insert a typed transaction'
);

select results_eq(
  $$select (created_at is not null and date = current_date) from public.transactions where id = '77777777-7777-7777-7777-777777777777'::uuid$$,
  array[true],
  'transaction creation timestamp and date defaults are set'
);

select results_eq(
  $$update public.transactions set description = 'Coffee shop' where id = '77777777-7777-7777-7777-777777777777'::uuid returning description$$,
  array['Coffee shop'],
  'owner can update own transaction'
);

select results_eq(
  $$delete from public.transactions where id = '77777777-7777-7777-7777-777777777777'::uuid returning description$$,
  array['Coffee shop'],
  'owner can delete own transaction'
);

select is_empty(
  $$select * from public.categories where clerk_user_id = 'clerk-user-b'$$,
  'owner cannot read another user categories'
);

select is_empty(
  $$update public.categories set name = 'Hacked' where clerk_user_id = 'clerk-user-b' returning id$$,
  'owner cannot update another user categories'
);

select is_empty(
  $$delete from public.categories where clerk_user_id = 'clerk-user-b' returning id$$,
  'owner cannot delete another user categories'
);

select throws_ok(
  $$insert into public.categories (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-b', 'Hacked')$$,
  '42501',
  null,
  'owner cannot insert a category for another user'
);

select is_empty(
  $$select * from public.payment_methods where clerk_user_id = 'clerk-user-b'$$,
  'owner cannot read another user payment methods'
);

select is_empty(
  $$update public.payment_methods set name = 'Hacked' where clerk_user_id = 'clerk-user-b' returning id$$,
  'owner cannot update another user payment methods'
);

select is_empty(
  $$delete from public.payment_methods where clerk_user_id = 'clerk-user-b' returning id$$,
  'owner cannot delete another user payment methods'
);

select throws_ok(
  $$insert into public.payment_methods (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-b', 'Hacked')$$,
  '42501',
  null,
  'owner cannot insert a payment method for another user'
);

select is_empty(
  $$select * from public.transactions where clerk_user_id = 'clerk-user-b'$$,
  'owner cannot read another user transactions'
);

select is_empty(
  $$update public.transactions set description = 'Hacked' where clerk_user_id = 'clerk-user-b' returning id$$,
  'owner cannot update another user transactions'
);

select is_empty(
  $$delete from public.transactions where clerk_user_id = 'clerk-user-b' returning id$$,
  'owner cannot delete another user transactions'
);

select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      '88888888-8888-8888-8888-888888888888'::uuid,
      'clerk-user-b',
      12.00,
      'expense',
      'Hacked',
      '22222222-2222-2222-2222-222222222222'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid
    )$$,
  '42501',
  null,
  'owner cannot insert a transaction for another user'
);

select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      '99999999-9999-9999-9999-999999999999'::uuid,
      'clerk-user-a',
      0,
      'expense',
      'Invalid amount',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    )$$,
  '23514',
  null,
  'non-positive transaction amounts are rejected'
);

select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'clerk-user-a',
      50.00,
      'transfer',
      'Invalid type',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    )$$,
  '23514',
  null,
  'transaction type is limited to income and expense'
);

select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, description, category_id, payment_method_id)
    values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      'clerk-user-a',
      50.00,
      'Missing type',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    )$$,
  '23502',
  null,
  'transaction type is required'
);

select results_eq(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
      'clerk-user-a',
      15.75,
      'expense',
      'Same-user category',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    ) returning description$$,
  array['Same-user category'],
  'same-user category relationship is accepted'
);

select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
      'clerk-user-a',
      50.00,
      'expense',
      'Wrong category',
      '22222222-2222-2222-2222-222222222222'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    )$$,
  '23503',
  null,
  'cross-user category relationship is rejected'
);

select results_eq(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
      'clerk-user-a',
      9.99,
      'expense',
      'Same-user payment method',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid
    ) returning description$$,
  array['Same-user payment method'],
  'same-user payment method relationship is accepted'
);

select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, type, description, category_id, payment_method_id)
    values (
      'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
      'clerk-user-a',
      9.99,
      'expense',
      'Wrong payment method',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid
    )$$,
  '23503',
  null,
  'cross-user payment method relationship is rejected'
);

select throws_ok(
  $$delete from public.categories where id = '11111111-1111-1111-1111-111111111111'::uuid$$,
  '23503',
  null,
  'category cannot be deleted while transactions reference it'
);

select throws_ok(
  $$delete from public.payment_methods where id = '33333333-3333-3333-3333-333333333333'::uuid$$,
  '23503',
  null,
  'payment method cannot be deleted while transactions reference it'
);

select throws_ok(
  $$insert into public.categories (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Food')$$,
  '23505',
  null,
  'duplicate category name for same user is rejected'
);

select throws_ok(
  $$insert into public.payment_methods (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Cash')$$,
  '23505',
  null,
  'duplicate payment method name for same user is rejected'
);

reset role;
select * from finish();
rollback;
