-- Pending calendar invites (accept / reject from notifications)
-- Run in Supabase SQL Editor

ALTER TABLE calendar_tag_members
  ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'accepted'
  CHECK (invite_status IN ('pending', 'accepted', 'rejected'));

-- Existing memberships are already active
UPDATE calendar_tag_members
SET invite_status = 'accepted'
WHERE invite_status IS NULL OR invite_status = '';

CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_pending
  ON calendar_tag_members (user_email, invite_status)
  WHERE invite_status = 'pending';

-- Required for accepting invites from notifications (see migration-calendar-invite-accept-policy.sql)
