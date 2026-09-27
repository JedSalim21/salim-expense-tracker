BEGIN;

CREATE OR REPLACE FUNCTION public.reset_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  authenticated_user_id text := auth.jwt() ->> 'sub';
BEGIN
  IF authenticated_user_id IS NULL OR btrim(authenticated_user_id) = '' THEN
    RAISE EXCEPTION 'Authentication is required to reset application data'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.transactions
  WHERE clerk_user_id = authenticated_user_id;

  DELETE FROM public.categories
  WHERE clerk_user_id = authenticated_user_id;

  DELETE FROM public.payment_methods
  WHERE clerk_user_id = authenticated_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_user_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_user_data() TO authenticated;

COMMIT;