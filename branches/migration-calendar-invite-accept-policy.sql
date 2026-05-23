-- Allow invitees to accept/reject their own calendar_tag_members row
-- Run in Supabase SQL Editor (after migration-add-notification-invites.sql)

DROP POLICY IF EXISTS "Invitees can update own membership" ON calendar_tag_members;
CREATE POLICY "Invitees can update own membership"
  ON calendar_tag_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
