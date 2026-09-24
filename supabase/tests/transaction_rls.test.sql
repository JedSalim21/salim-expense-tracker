begin;
select plan(26);

-- Create two distinct Clerk user identities for ownership tests.
insert into public.categories (id, clerk_user_id, name)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'clerk-user-a', 'Food'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'clerk-user-b', 'Travel');

insert into public.payment_methods (id, clerk_user_id, name)
values
  ('33333333-3333-3333-3333-333333333333'::uuid, 'clerk-user-a', 'Cash'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'clerk-user-b', 'Credit Card');

-- own-row SELECT allowed
set local request.jwt.claim.sub = 'clerk-user-a';
select results_eq(
  $$select count(*)::int from public.categories where clerk_user_id = 'clerk-user-a'$$,
  array[1],
  'owner can read own categories'
);

-- own-row INSERT allowed
select results_eq(
  $$insert into public.categories (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Utilities') returning name$$,
  array['Utilities'],
  'owner can insert own category'
);

-- own-row UPDATE allowed
select results_eq(
  $$update public.categories set name = 'Meals' where clerk_user_id = 'clerk-user-a' and name = 'Food' returning name$$,
  array['Meals'],
  'owner can update own category'
);

-- own-row DELETE allowed
select results_eq(
  $$delete from public.categories where clerk_user_id = 'clerk-user-a' and name = 'Meals' returning name$$,
  array['Meals'],
  'owner can delete own category'
);

-- cross-user SELECT rejected
set local request.jwt.claim.sub = 'clerk-user-b';
select is_empty(
  $$select * from public.categories where clerk_user_id = 'clerk-user-a'$$,
  'other user cannot read owner category rows'
);

-- cross-user INSERT rejected
select throws_ok(
  $$insert into public.categories (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Hacked')$$,
  '42501',
  null,
  'other user cannot insert another user category row'
);

-- cross-user UPDATE rejected
select throws_ok(
  $$update public.categories set name = 'Hacked' where clerk_user_id = 'clerk-user-a'$$,
  '42501',
  null,
  'other user cannot update another user category row'
);

-- cross-user DELETE rejected
select throws_ok(
  $$delete from public.categories where clerk_user_id = 'clerk-user-a'$$,
  '42501',
  null,
  'other user cannot delete another user category row'
);

-- same-user category FK accepted
set local request.jwt.claim.sub = 'clerk-user-a';
select results_eq(
  $$insert into public.categories (id, clerk_user_id, name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'clerk-user-a', 'Groceries') returning name$$,
  array['Groceries'],
  'owner can create category for same user'
);

select results_eq(
  $$insert into public.transactions (id, clerk_user_id, amount, description, category_id, payment_method_id, date)
    values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      'clerk-user-a',
      25.50,
      'Bakery',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      current_date
    ) returning description$$,
  array['Bakery'],
  'same-user category FK is accepted'
);

-- cross-user category FK rejected
select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, description, category_id, payment_method_id, date)
    values (
      'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
      'clerk-user-a',
      50.00,
      'Wrong category',
      '22222222-2222-2222-2222-222222222222'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      current_date
    )$$,
  '23503',
  null,
  'cross-user category FK is rejected'
);

-- same-user payment method FK accepted
select results_eq(
  $$insert into public.payment_methods (id, clerk_user_id, name) values ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'clerk-user-a', 'Debit Card') returning name$$,
  array['Debit Card'],
  'owner can create payment method for same user'
);

select results_eq(
  $$insert into public.transactions (id, clerk_user_id, amount, description, category_id, payment_method_id, date)
    values (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
      'clerk-user-a',
      15.75,
      'Coffee shop',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
      current_date
    ) returning description$$,
  array['Coffee shop'],
  'same-user payment method FK is accepted'
);

-- cross-user payment method FK rejected
select throws_ok(
  $$insert into public.transactions (id, clerk_user_id, amount, description, category_id, payment_method_id, date)
    values (
      'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
      'clerk-user-a',
      9.99,
      'Wrong payment method',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      current_date
    )$$,
  '23503',
  null,
  'cross-user payment method FK is rejected'
);

-- duplicate category name for same Clerk user rejected
select throws_ok(
  $$insert into public.categories (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Groceries')$$,
  '23505',
  null,
  'duplicate category name for same user is rejected'
);

-- duplicate payment method name for same Clerk user rejected
select throws_ok(
  $$insert into public.payment_methods (id, clerk_user_id, name) values (gen_random_uuid(), 'clerk-user-a', 'Debit Card')$$,
  '23505',
  null,
  'duplicate payment method name for same user is rejected'
);

select * from finish();
rollback;
