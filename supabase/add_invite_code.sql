-- ═══════════════════════════════════════════════════
-- ADD invite_code column to spaces for friend invitations
-- ═══════════════════════════════════════════════════

-- Add invite_code column (unique, nullable)
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate invite codes for existing spaces that don't have one
UPDATE public.spaces
SET invite_code = substr(md5(random()::text || id::text), 1, 8)
WHERE invite_code IS NULL;

-- Make invite_code NOT NULL with default for future spaces
ALTER TABLE public.spaces
  ALTER COLUMN invite_code SET DEFAULT substr(md5(random()::text), 1, 8);

SELECT 'invite_code column added to spaces' as status;
