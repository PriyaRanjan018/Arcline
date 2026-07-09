-- Ensure username and name are unique in the profiles table

DO $$
BEGIN
    -- Add unique constraint for 'name' (Display Name) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_name_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_key UNIQUE (name);
    END IF;

    -- Add unique constraint for 'username' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;
