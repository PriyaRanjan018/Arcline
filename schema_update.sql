-- Run this in your Supabase SQL Editor to add the new profile fields

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS builder_role TEXT,
ADD COLUMN IF NOT EXISTS currently_building TEXT,
ADD COLUMN IF NOT EXISTS pronouns TEXT,
ADD COLUMN IF NOT EXISTS custom_pronouns TEXT,
ADD COLUMN IF NOT EXISTS building_since INTEGER,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_entry_count BOOLEAN DEFAULT true;

-- Important: Refresh the schema cache in Supabase after running this!
-- You can do this by going to Settings -> API -> Schema Cache -> Clear cache
-- Or just reload your frontend server.
