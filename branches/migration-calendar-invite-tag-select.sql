-- Pending invitees can read calendar tag metadata for notifications (accept/reject UI)
-- Run after migration-calendar-pending-member-access.sql

DROP POLICY IF EXISTS "Pending invitees can view calendar tags" ON calendar_tags;
CREATE POLICY "Pending invitees can view calendar tags"
  ON calendar_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_tag_members m
      WHERE m.tag_id = calendar_tags.id
        AND coalesce(m.invite_status, 'accepted') = 'pending'
        AND (
          m.user_id = auth.uid()
          OR lower(m.user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );
