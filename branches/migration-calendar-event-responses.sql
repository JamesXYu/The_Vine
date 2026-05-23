-- Per-member accept/reject for calendar events (Teams-style RSVP)
-- Run in Supabase SQL Editor after migration-add-calendar.sql

CREATE TABLE IF NOT EXISTS calendar_event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (response_status IN ('pending', 'accepted', 'rejected')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_responses_event
  ON calendar_event_responses (event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_responses_user_pending
  ON calendar_event_responses (user_email, response_status)
  WHERE response_status = 'pending';

ALTER TABLE calendar_event_responses ENABLE ROW LEVEL SECURITY;

-- Members of the event's calendar can see all responses
DROP POLICY IF EXISTS "Members can view event responses" ON calendar_event_responses;
CREATE POLICY "Members can view event responses"
  ON calendar_event_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_id AND is_calendar_tag_member(e.tag_id)
    )
  );

-- Editors/owners seed responses when creating events
DROP POLICY IF EXISTS "Editors can insert event responses" ON calendar_event_responses;
CREATE POLICY "Editors can insert event responses"
  ON calendar_event_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_id AND can_edit_calendar_tag(e.tag_id)
    )
  );

-- Invitees update only their own row
DROP POLICY IF EXISTS "Members can update own event response" ON calendar_event_responses;
CREATE POLICY "Members can update own event response"
  ON calendar_event_responses FOR UPDATE
  USING (
    user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
