-- Secure RPC to allow a user to delete their own account
-- This must be SECURITY DEFINER to bypass RLS and delete from auth.users.
-- auth.uid() ensures that users can only delete themselves.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the ID of the user making the request
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users
  -- If your foreign keys on profiles, builds, and entries are set to ON DELETE CASCADE,
  -- this single operation will wipe all associated user data automatically.
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;
