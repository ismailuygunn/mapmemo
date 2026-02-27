-- ═══════════════════════════════════════════════════════
-- FIX v4: MINIMAL RLS fix — just fix space_members recursion
-- ═══════════════════════════════════════════════════════
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- This ONLY fixes the recursion issue without touching other policies.

-- Step 1: Create helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT space_id FROM space_members WHERE user_id = auth.uid();
$$;

-- Step 2: Drop problematic space_members policies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'space_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.space_members', pol.policyname);
  END LOOP;
END $$;

-- Step 3: Create simple non-recursive policies
CREATE POLICY "sm_select" ON public.space_members FOR SELECT
  USING (user_id = auth.uid() OR space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "sm_insert" ON public.space_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sm_update" ON public.space_members FOR UPDATE
  USING (user_id = auth.uid() OR space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "sm_delete" ON public.space_members FOR DELETE
  USING (user_id = auth.uid() OR space_id IN (SELECT public.get_my_space_ids()));

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- Done! Verify with:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'space_members';
