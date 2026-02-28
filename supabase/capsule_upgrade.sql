-- ═══════════════════════════════════════════
-- CAPSULE UPGRADE MIGRATION
-- Adds collaborators, voting, time, types
-- ═══════════════════════════════════════════

-- New columns
ALTER TABLE public.memory_capsules
  ADD COLUMN IF NOT EXISTS reveal_time time DEFAULT '00:00',
  ADD COLUMN IF NOT EXISTS allow_early_vote boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_votes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS collaborators uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capsule_type text DEFAULT 'memory',
  ADD COLUMN IF NOT EXISTS color_theme text DEFAULT 'navy';

-- Update RLS: collaborators can also see/interact with capsules
DROP POLICY IF EXISTS "capsules_select" ON public.memory_capsules;
DROP POLICY IF EXISTS "capsules_update" ON public.memory_capsules;

CREATE POLICY "capsules_select" ON public.memory_capsules FOR SELECT
  USING (
    created_by = auth.uid()
    OR auth.uid() = ANY(collaborators)
    OR space_id IN (SELECT public.get_my_space_ids())
  );

CREATE POLICY "capsules_update" ON public.memory_capsules FOR UPDATE
  USING (
    created_by = auth.uid()
    OR auth.uid() = ANY(collaborators)
    OR space_id IN (SELECT public.get_my_space_ids())
  );
