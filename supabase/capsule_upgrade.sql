-- ═══════════════════════════════════════════
-- CAPSULE UPGRADE MIGRATION
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1) Add new columns
ALTER TABLE public.memory_capsules
  ADD COLUMN IF NOT EXISTS reveal_time time DEFAULT '00:00',
  ADD COLUMN IF NOT EXISTS allow_early_vote boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_votes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS collaborators uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capsule_type text DEFAULT 'memory',
  ADD COLUMN IF NOT EXISTS color_theme text DEFAULT 'navy';

-- 2) Make space_id nullable (capsules can exist without a space)
ALTER TABLE public.memory_capsules
  ALTER COLUMN space_id DROP NOT NULL;

-- 3) Fix RLS policies — allow users to create/view their own capsules
DROP POLICY IF EXISTS "capsules_select" ON public.memory_capsules;
DROP POLICY IF EXISTS "capsules_insert" ON public.memory_capsules;
DROP POLICY IF EXISTS "capsules_update" ON public.memory_capsules;
DROP POLICY IF EXISTS "capsules_delete" ON public.memory_capsules;

-- SELECT: own capsules OR collaborator OR space member
CREATE POLICY "capsules_select" ON public.memory_capsules FOR SELECT USING (
  created_by = auth.uid()
  OR auth.uid() = ANY(collaborators)
  OR (space_id IS NOT NULL AND space_id IN (SELECT public.get_my_space_ids()))
);

-- INSERT: authenticated user can create (their own)
CREATE POLICY "capsules_insert" ON public.memory_capsules FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- UPDATE: creator or collaborator
CREATE POLICY "capsules_update" ON public.memory_capsules FOR UPDATE USING (
  created_by = auth.uid()
  OR auth.uid() = ANY(collaborators)
);

-- DELETE: only creator
CREATE POLICY "capsules_delete" ON public.memory_capsules FOR DELETE
  USING (created_by = auth.uid());

-- ═══════════════════════════════════════════
-- 4) Storage: Ensure pin-media bucket allows capsule uploads
-- The pin-media bucket should already exist, but ensure policies allow capsule paths
-- ═══════════════════════════════════════════

-- Make sure pin-media bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-media', 'pin-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure upload policy exists for authenticated users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pin_media_storage_upload' AND tablename = 'objects') THEN
    CREATE POLICY "pin_media_storage_upload" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'pin-media' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Ensure read policy exists (public read)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pin_media_storage_read' AND tablename = 'objects') THEN
    CREATE POLICY "pin_media_storage_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'pin-media');
  END IF;
END $$;
