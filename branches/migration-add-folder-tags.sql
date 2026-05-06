-- =====================================================
-- Migration: Add folder tags support
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add tag columns to folders table (personal)
ALTER TABLE folders 
  ADD COLUMN IF NOT EXISTS tag_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tag_color TEXT DEFAULT NULL;

-- Add tag columns to public_folders table (public library)
ALTER TABLE public_folders 
  ADD COLUMN IF NOT EXISTS tag_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tag_color TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN folders.tag_name IS 'Optional tag name to display on documents in this folder';
COMMENT ON COLUMN folders.tag_color IS 'Color for the folder tag (hex code)';
COMMENT ON COLUMN public_folders.tag_name IS 'Optional tag name to display on documents in this folder';
COMMENT ON COLUMN public_folders.tag_color IS 'Color for the folder tag (hex code)';

-- =====================================================
-- Verification
-- =====================================================
SELECT 
  'Folder tags migration complete' as status,
  (SELECT COUNT(*) FROM folders) as folders_count,
  (SELECT COUNT(*) FROM public_folders) as public_folders_count;
