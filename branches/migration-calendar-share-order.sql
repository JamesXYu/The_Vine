-- Calendar sharing search + per-user tag order
-- Run in Supabase SQL Editor

-- Searchable directory of app users (upserted on login from the client)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_profiles_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles (lower(display_name));

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON user_profiles;
CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Per-user tag order in the calendar bar
ALTER TABLE calendar_tag_members
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_sort
  ON calendar_tag_members (user_id, sort_order);
