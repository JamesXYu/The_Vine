-- =====================================================
-- Migration: Add saved_documents table
-- Run this in Supabase SQL Editor if the table doesn't exist
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create saved_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

-- Add is_public column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_documents' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE saved_documents ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_saved_documents_user_id ON saved_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_documents_document_id ON saved_documents(document_id);

-- Enable RLS
ALTER TABLE saved_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own saved documents" ON saved_documents;
DROP POLICY IF EXISTS "Users can save documents" ON saved_documents;
DROP POLICY IF EXISTS "Users can unsave their own documents" ON saved_documents;

-- Create RLS policies
CREATE POLICY "Users can view their own saved documents"
  ON saved_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save documents"
  ON saved_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own documents"
  ON saved_documents FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Verification
-- =====================================================
SELECT 'saved_documents table ready' as status;
