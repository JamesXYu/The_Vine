-- =====================================================
-- Migration: Calendar with tags and collaboration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Tags group events into shared calendars
CREATE TABLE IF NOT EXISTS calendar_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#667eea',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_email TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT calendar_tags_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Members who can view/edit a tag's shared calendar
CREATE TABLE IF NOT EXISTS calendar_tag_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID REFERENCES calendar_tags(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tag_id, user_email)
);

-- Events belong to a tag (same tag = same shared calendar)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID REFERENCES calendar_tags(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_email TEXT DEFAULT NULL,
  creator_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT calendar_events_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_calendar_tags_owner ON calendar_tags(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_user ON calendar_tag_members(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_tag ON calendar_tag_members(tag_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tag ON calendar_events(tag_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_at);

ALTER TABLE calendar_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tag_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Helper: user is member of a tag
CREATE OR REPLACE FUNCTION is_calendar_tag_member(p_tag_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendar_tag_members m
    WHERE m.tag_id = p_tag_id
      AND (
        m.user_id = auth.uid()
        OR lower(m.user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: user can edit tag calendar
CREATE OR REPLACE FUNCTION can_edit_calendar_tag(p_tag_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendar_tag_members m
    WHERE m.tag_id = p_tag_id
      AND m.role IN ('owner', 'editor')
      AND (
        m.user_id = auth.uid()
        OR lower(m.user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- calendar_tags policies
CREATE POLICY "Members can view calendar tags"
  ON calendar_tags FOR SELECT
  USING (is_calendar_tag_member(id) OR owner_id = auth.uid());

CREATE POLICY "Users can create calendar tags"
  ON calendar_tags FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update calendar tags"
  ON calendar_tags FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete calendar tags"
  ON calendar_tags FOR DELETE
  USING (owner_id = auth.uid());

-- calendar_tag_members policies
CREATE POLICY "Members can view tag membership"
  ON calendar_tag_members FOR SELECT
  USING (
    is_calendar_tag_member(tag_id)
    OR user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Owners can add tag members"
  ON calendar_tag_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update tag members"
  ON calendar_tag_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can remove tag members"
  ON calendar_tag_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- calendar_events policies
CREATE POLICY "Members can view calendar events"
  ON calendar_events FOR SELECT
  USING (is_calendar_tag_member(tag_id));

CREATE POLICY "Editors can create calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (can_edit_calendar_tag(tag_id));

CREATE POLICY "Editors can update calendar events"
  ON calendar_events FOR UPDATE
  USING (can_edit_calendar_tag(tag_id));

CREATE POLICY "Editors can delete calendar events"
  ON calendar_events FOR DELETE
  USING (can_edit_calendar_tag(tag_id));

-- Auto-add owner as member when tag is created
CREATE OR REPLACE FUNCTION add_calendar_tag_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO calendar_tag_members (tag_id, user_id, user_email, role)
  VALUES (NEW.id, NEW.owner_id, lower(NEW.owner_email), 'owner')
  ON CONFLICT (tag_id, user_email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_calendar_tag_created ON calendar_tags;
CREATE TRIGGER on_calendar_tag_created
  AFTER INSERT ON calendar_tags
  FOR EACH ROW EXECUTE FUNCTION add_calendar_tag_owner_member();
