-- Pending invitees are not active members until they accept
-- Run in Supabase SQL Editor (after migration-add-notification-invites.sql)

CREATE OR REPLACE FUNCTION is_calendar_tag_member(p_tag_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendar_tag_members m
    WHERE m.tag_id = p_tag_id
      AND coalesce(m.invite_status, 'accepted') = 'accepted'
      AND (
        m.user_id = auth.uid()
        OR lower(m.user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_edit_calendar_tag(p_tag_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendar_tag_members m
    WHERE m.tag_id = p_tag_id
      AND coalesce(m.invite_status, 'accepted') = 'accepted'
      AND m.role IN ('owner', 'editor')
      AND (
        m.user_id = auth.uid()
        OR lower(m.user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
