-- ═══════════════════════════════════════════════════════════════
-- FIX v3: NUCLEAR FIX for ALL RLS recursion issues
-- ═══════════════════════════════════════════════════════════════
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste ALL → Run
--
-- This completely removes ALL policies that could cause recursion
-- and replaces them with simple, non-recursive alternatives.

-- ==========================================
-- STEP 0: Disable RLS temporarily to clean up
-- ==========================================
ALTER TABLE IF EXISTS public.space_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pin_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.capsules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetup_responses DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 1: DROP ALL existing policies on ALL tables
-- ==========================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ==========================================
-- STEP 2: Create helper functions (SECURITY DEFINER = bypasses RLS)
-- ==========================================

-- Function: Get space IDs for current user
CREATE OR REPLACE FUNCTION public.get_my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT space_id FROM space_members WHERE user_id = auth.uid();
$$;

-- Function: Check if user is owner/admin of a space
CREATE OR REPLACE FUNCTION public.is_space_admin(target_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = target_space_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- ==========================================
-- STEP 3: Re-enable RLS
-- ==========================================
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pin_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetup_responses ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 4: Create SIMPLE policies (NO self-referencing!)
-- ==========================================

-- ── space_members ──
-- SELECT: user can see their own rows + rows of their spaces (via function)
CREATE POLICY "sm_select" ON public.space_members FOR SELECT
  USING (user_id = auth.uid() OR space_id IN (SELECT public.get_my_space_ids()));

-- INSERT: user can add themselves only
CREATE POLICY "sm_insert" ON public.space_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: only space admins (via function, no recursion)
CREATE POLICY "sm_update" ON public.space_members FOR UPDATE
  USING (public.is_space_admin(space_id));

-- DELETE: only space admins can remove others (via function)
CREATE POLICY "sm_delete" ON public.space_members FOR DELETE
  USING (public.is_space_admin(space_id) AND user_id != auth.uid());

-- ── spaces ──
CREATE POLICY "spaces_select" ON public.spaces FOR SELECT
  USING (id IN (SELECT public.get_my_space_ids()) OR created_by = auth.uid());

CREATE POLICY "spaces_insert" ON public.spaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "spaces_update" ON public.spaces FOR UPDATE
  USING (public.is_space_admin(id));

-- ── pins ──
CREATE POLICY "pins_select" ON public.pins FOR SELECT
  USING (space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "pins_insert" ON public.pins FOR INSERT
  WITH CHECK (space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "pins_update" ON public.pins FOR UPDATE
  USING (space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "pins_delete" ON public.pins FOR DELETE
  USING (space_id IN (SELECT public.get_my_space_ids()));

-- ── pin_media ──
CREATE POLICY "pin_media_select" ON public.pin_media FOR SELECT
  USING (pin_id IN (SELECT id FROM public.pins WHERE space_id IN (SELECT public.get_my_space_ids())));

CREATE POLICY "pin_media_insert" ON public.pin_media FOR INSERT
  WITH CHECK (pin_id IN (SELECT id FROM public.pins WHERE space_id IN (SELECT public.get_my_space_ids())));

CREATE POLICY "pin_media_delete" ON public.pin_media FOR DELETE
  USING (pin_id IN (SELECT id FROM public.pins WHERE space_id IN (SELECT public.get_my_space_ids())));

-- ── trips ──
CREATE POLICY "trips_select" ON public.trips FOR SELECT
  USING (space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "trips_insert" ON public.trips FOR INSERT
  WITH CHECK (space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "trips_update" ON public.trips FOR UPDATE
  USING (space_id IN (SELECT public.get_my_space_ids()));

CREATE POLICY "trips_delete" ON public.trips FOR DELETE
  USING (space_id IN (SELECT public.get_my_space_ids()));

-- ── capsules (if exists) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'capsules' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "capsules_select" ON public.capsules FOR SELECT USING (space_id IN (SELECT public.get_my_space_ids()))';
    EXECUTE 'CREATE POLICY "capsules_insert" ON public.capsules FOR INSERT WITH CHECK (space_id IN (SELECT public.get_my_space_ids()))';
    EXECUTE 'CREATE POLICY "capsules_update" ON public.capsules FOR UPDATE USING (space_id IN (SELECT public.get_my_space_ids()))';
  END IF;
END $$;

-- ── meetups (if exists) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetups' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "meetups_select" ON public.meetups FOR SELECT USING (space_id IN (SELECT public.get_my_space_ids()))';
    EXECUTE 'CREATE POLICY "meetups_insert" ON public.meetups FOR INSERT WITH CHECK (space_id IN (SELECT public.get_my_space_ids()))';
    EXECUTE 'CREATE POLICY "meetups_update" ON public.meetups FOR UPDATE USING (space_id IN (SELECT public.get_my_space_ids()))';
  END IF;
END $$;

-- ── meetup_responses (if exists) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetup_responses' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "mr_select" ON public.meetup_responses FOR SELECT USING (user_id = auth.uid() OR meetup_id IN (SELECT id FROM public.meetups WHERE space_id IN (SELECT public.get_my_space_ids())))';
    EXECUTE 'CREATE POLICY "mr_insert" ON public.meetup_responses FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "mr_update" ON public.meetup_responses FOR UPDATE USING (user_id = auth.uid())';
  END IF;
END $$;

-- ==========================================
-- DONE! All RLS policies are now non-recursive.
-- ==========================================
-- Verification: Run this to check all policies:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
