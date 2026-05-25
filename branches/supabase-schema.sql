-- =====================================================
-- The Vine - Supabase Database Schema
-- Single source of truth: run in Supabase SQL Editor
-- Safe to re-run on existing projects (IF NOT EXISTS / DROP IF EXISTS)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FOLDERS & DOCUMENTS (personal)
-- =====================================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  tag_name TEXT DEFAULT NULL,
  tag_color TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT folders_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT DEFAULT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  folder TEXT DEFAULT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT documents_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 500)
);

-- =====================================================
-- PUBLIC LIBRARY
-- =====================================================
CREATE TABLE IF NOT EXISTS public_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT DEFAULT NULL,
  display_name TEXT DEFAULT '',
  folder TEXT DEFAULT NULL,
  original_doc_id UUID DEFAULT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  tag_name TEXT DEFAULT NULL,
  tag_color TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN folders.tag_name IS 'Optional tag name to display on documents in this folder';
COMMENT ON COLUMN folders.tag_color IS 'Color for the folder tag (hex code)';
COMMENT ON COLUMN public_folders.tag_name IS 'Optional tag name to display on documents in this folder';
COMMENT ON COLUMN public_folders.tag_color IS 'Color for the folder tag (hex code)';

-- =====================================================
-- SAVED DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

-- =====================================================
-- USER PROFILES (calendar sharing search)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_profiles_email_unique UNIQUE (email)
);

-- =====================================================
-- CALENDAR
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#667eea',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_email TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT calendar_tags_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

CREATE TABLE IF NOT EXISTS calendar_tag_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID REFERENCES calendar_tags(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invite_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (invite_status IN ('pending', 'accepted', 'rejected')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tag_id, user_email)
);

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

-- Backfill columns on existing databases
ALTER TABLE calendar_tag_members
  ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (invite_status IN ('pending', 'accepted', 'rejected'));

ALTER TABLE calendar_tag_members
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE calendar_tag_members
SET invite_status = 'accepted'
WHERE invite_status IS NULL OR invite_status = '';

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_public_folders_user_id ON public_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_public_documents_user_id ON public_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);
CREATE INDEX IF NOT EXISTS idx_public_documents_folder ON public_documents(folder);
CREATE INDEX IF NOT EXISTS idx_saved_documents_user_id ON saved_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_documents_document_id ON saved_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles (lower(display_name));
CREATE INDEX IF NOT EXISTS idx_calendar_tags_owner ON calendar_tags(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_user ON calendar_tag_members(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_tag ON calendar_tag_members(tag_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_pending
  ON calendar_tag_members (user_email, invite_status)
  WHERE invite_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_calendar_tag_members_sort
  ON calendar_tag_members (user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tag ON calendar_events(tag_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_event_responses_event
  ON calendar_event_responses (event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_responses_user_pending
  ON calendar_event_responses (user_email, response_status)
  WHERE response_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_calendar_member_removals_user
  ON calendar_member_removals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_member_removals_email
  ON calendar_member_removals (lower(user_email), created_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

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
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION add_calendar_tag_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO calendar_tag_members (tag_id, user_id, user_email, role)
  VALUES (NEW.id, NEW.owner_id, lower(NEW.owner_email), 'owner')
  ON CONFLICT (tag_id, user_email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_most_saved_public_documents(p_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  user_id uuid,
  user_email text,
  display_name text,
  folder text,
  original_doc_id uuid,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  save_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    pd.id,
    pd.title,
    pd.content,
    pd.user_id,
    pd.user_email,
    pd.display_name,
    pd.folder,
    pd.original_doc_id,
    pd.published_at,
    pd.created_at,
    pd.updated_at,
    COUNT(sd.id)::bigint AS save_count
  FROM public_documents pd
  INNER JOIN saved_documents sd ON sd.document_id = pd.id
  GROUP BY pd.id
  ORDER BY save_count DESC, pd.published_at DESC NULLS LAST
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION get_most_saved_public_documents(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_saved_public_documents(integer) TO anon;

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_public_folders_updated_at ON public_folders;
CREATE TRIGGER update_public_folders_updated_at
  BEFORE UPDATE ON public_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_public_documents_updated_at ON public_documents;
CREATE TRIGGER update_public_documents_updated_at
  BEFORE UPDATE ON public_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_calendar_tag_created ON calendar_tags;
CREATE TRIGGER on_calendar_tag_created
  AFTER INSERT ON calendar_tags
  FOR EACH ROW EXECUTE FUNCTION add_calendar_tag_owner_member();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tag_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_member_removals ENABLE ROW LEVEL SECURITY;

-- folders
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own folders" ON folders;
CREATE POLICY "Users can create their own folders"
  ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;
CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE USING (auth.uid() = user_id);

-- documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
CREATE POLICY "Users can create their own documents"
  ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Everyone can view published documents" ON documents;
CREATE POLICY "Everyone can view published documents"
  ON documents FOR SELECT USING (is_published = TRUE);

-- public_documents
DROP POLICY IF EXISTS "Everyone can view public documents" ON public_documents;
CREATE POLICY "Everyone can view public documents"
  ON public_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert public documents" ON public_documents;
CREATE POLICY "Admins can insert public documents"
  ON public_documents FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update public documents" ON public_documents;
CREATE POLICY "Admins can update public documents"
  ON public_documents FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admins can delete public documents" ON public_documents;
CREATE POLICY "Admins can delete public documents"
  ON public_documents FOR DELETE USING (true);

-- public_folders
DROP POLICY IF EXISTS "Everyone can view public folders" ON public_folders;
CREATE POLICY "Everyone can view public folders"
  ON public_folders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert public folders" ON public_folders;
CREATE POLICY "Admins can insert public folders"
  ON public_folders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update public folders" ON public_folders;
CREATE POLICY "Admins can update public folders"
  ON public_folders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admins can delete public folders" ON public_folders;
CREATE POLICY "Admins can delete public folders"
  ON public_folders FOR DELETE USING (true);

-- saved_documents
DROP POLICY IF EXISTS "Users can view their own saved documents" ON saved_documents;
CREATE POLICY "Users can view their own saved documents"
  ON saved_documents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can save documents" ON saved_documents;
CREATE POLICY "Users can save documents"
  ON saved_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unsave their own documents" ON saved_documents;
CREATE POLICY "Users can unsave their own documents"
  ON saved_documents FOR DELETE USING (auth.uid() = user_id);

-- user_profiles
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON user_profiles;
CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- calendar_tags
DROP POLICY IF EXISTS "Members can view calendar tags" ON calendar_tags;
CREATE POLICY "Members can view calendar tags"
  ON calendar_tags FOR SELECT
  USING (is_calendar_tag_member(id) OR owner_id = auth.uid());
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
DROP POLICY IF EXISTS "Users can create calendar tags" ON calendar_tags;
CREATE POLICY "Users can create calendar tags"
  ON calendar_tags FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can update calendar tags" ON calendar_tags;
CREATE POLICY "Owners can update calendar tags"
  ON calendar_tags FOR UPDATE USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Owners can delete calendar tags" ON calendar_tags;
CREATE POLICY "Owners can delete calendar tags"
  ON calendar_tags FOR DELETE USING (owner_id = auth.uid());

-- calendar_tag_members
DROP POLICY IF EXISTS "Members can view tag membership" ON calendar_tag_members;
CREATE POLICY "Members can view tag membership"
  ON calendar_tag_members FOR SELECT
  USING (
    is_calendar_tag_member(tag_id)
    OR user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
DROP POLICY IF EXISTS "Owners can add tag members" ON calendar_tag_members;
CREATE POLICY "Owners can add tag members"
  ON calendar_tag_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Owners can update tag members" ON calendar_tag_members;
CREATE POLICY "Owners can update tag members"
  ON calendar_tag_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Owners can remove tag members" ON calendar_tag_members;
CREATE POLICY "Owners can remove tag members"
  ON calendar_tag_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
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

-- calendar_events
DROP POLICY IF EXISTS "Members can view calendar events" ON calendar_events;
CREATE POLICY "Members can view calendar events"
  ON calendar_events FOR SELECT USING (is_calendar_tag_member(tag_id));
DROP POLICY IF EXISTS "Editors can create calendar events" ON calendar_events;
CREATE POLICY "Editors can create calendar events"
  ON calendar_events FOR INSERT WITH CHECK (can_edit_calendar_tag(tag_id));
DROP POLICY IF EXISTS "Editors can update calendar events" ON calendar_events;
CREATE POLICY "Editors can update calendar events"
  ON calendar_events FOR UPDATE USING (can_edit_calendar_tag(tag_id));
DROP POLICY IF EXISTS "Editors can delete calendar events" ON calendar_events;
CREATE POLICY "Editors can delete calendar events"
  ON calendar_events FOR DELETE USING (can_edit_calendar_tag(tag_id));

-- calendar_event_responses
DROP POLICY IF EXISTS "Members can view event responses" ON calendar_event_responses;
CREATE POLICY "Members can view event responses"
  ON calendar_event_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_id AND is_calendar_tag_member(e.tag_id)
    )
  );
DROP POLICY IF EXISTS "Editors can insert event responses" ON calendar_event_responses;
CREATE POLICY "Editors can insert event responses"
  ON calendar_event_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_id AND can_edit_calendar_tag(e.tag_id)
    )
  );
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

-- calendar_member_removals
DROP POLICY IF EXISTS "Removed users can view their removal notices" ON calendar_member_removals;
CREATE POLICY "Removed users can view their removal notices"
  ON calendar_member_removals FOR SELECT
  USING (
    user_id = auth.uid()
    OR lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
DROP POLICY IF EXISTS "Calendar owners can record member removals" ON calendar_member_removals;
CREATE POLICY "Calendar owners can record member removals"
  ON calendar_member_removals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_tags t
      WHERE t.id = tag_id AND t.owner_id = auth.uid()
    )
  );

-- =====================================================
-- STORAGE (avatars)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can view public avatars" ON storage.objects;
CREATE POLICY "Users can view public avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'The Vine schema ready' AS status;
