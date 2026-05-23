-- Notify users when they are removed from a shared calendar
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS calendar_member_removals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES calendar_tags(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  removed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  removed_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_member_removals_user
  ON calendar_member_removals (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_member_removals_email
  ON calendar_member_removals (lower(user_email), created_at DESC);

ALTER TABLE calendar_member_removals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Removed users can view their removal notices"
  ON calendar_member_removals FOR SELECT
  USING (
    user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Calendar owners can record member removals"
  ON calendar_member_removals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
  );
