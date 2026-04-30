-- =====================================================
-- The Vine - Supabase Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FOLDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT folders_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
-- PUBLIC DOCUMENTS TABLE (separate from personal)
-- =====================================================
CREATE TABLE IF NOT EXISTS public_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT DEFAULT '',
  folder TEXT DEFAULT NULL,
  original_doc_id UUID DEFAULT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PUBLIC FOLDERS TABLE (separate from personal)
-- =====================================================
CREATE TABLE IF NOT EXISTS public_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_public_folders_user_id ON public_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_public_documents_user_id ON public_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);
CREATE INDEX IF NOT EXISTS idx_public_documents_folder ON public_documents(folder);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Folders: Users can only see and manage their own folders
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Documents: Users can see their own documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Public documents: Everyone can view published documents (no auth required)
CREATE POLICY "Everyone can view published documents"
  ON documents FOR SELECT
  USING (is_published = TRUE);

-- Admins can manage all documents (you'll need to add admin role checking in your app)
-- Note: For full admin support, create an admin_roles table or use user_metadata

-- Public documents: Everyone can view (no auth required for reading)
CREATE POLICY "Everyone can view public documents"
  ON public_documents FOR SELECT
  USING (true);

-- Admins can manage public documents
CREATE POLICY "Admins can insert public documents"
  ON public_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update public documents"
  ON public_documents FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete public documents"
  ON public_documents FOR DELETE
  USING (true);

-- Public folders: Everyone can view
CREATE POLICY "Everyone can view public folders"
  ON public_folders FOR SELECT
  USING (true);

-- Admins can manage public folders
CREATE POLICY "Admins can insert public folders"
  ON public_folders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update public folders"
  ON public_folders FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete public folders"
  ON public_folders FOR DELETE
  USING (true);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_folders_updated_at
  BEFORE UPDATE ON public_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_documents_updated_at
  BEFORE UPDATE ON public_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET for avatars
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view public avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
  'Folders table created' as status,
  (SELECT COUNT(*) FROM folders) as total_tables
UNION ALL
SELECT 
  'Documents table created' as status,
  (SELECT COUNT(*) FROM documents) as total_tables;
