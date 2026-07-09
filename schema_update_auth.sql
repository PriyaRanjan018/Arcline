-- Secure RPC to lookup a user's primary identity provider by email
-- This must be SECURITY DEFINER to bypass RLS and query auth tables.
CREATE OR REPLACE FUNCTION public.get_user_provider_by_email(check_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id UUID;
  provider_name TEXT;
BEGIN
  -- 1. Find the user ID for this email
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = check_email
  LIMIT 1;

  IF found_user_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  -- 2. Find the provider
  SELECT provider INTO provider_name
  FROM auth.identities
  WHERE user_id = found_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF provider_name IS NULL THEN
    RETURN 'email';
  END IF;

  RETURN provider_name;
END;
$$;
