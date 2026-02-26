-- ═══════════════════════════════════════════════════════════════
-- FIX: Infinite recursion in space_members RLS policies
-- ═══════════════════════════════════════════════════════════════
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- This fixes ALL space_members policies to avoid self-referencing

-- ==========================================
-- Step 1: Drop ALL existing space_members policies
-- ==========================================
DROP POLICY IF EXISTS "Space Members: members can read" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: members can read co-members" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: owner/admin can update roles" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: owner/admin can delete" ON public.space_members;
DROP POLICY IF EXISTS "space_members_insert" ON public.space_members;
DROP POLICY IF EXISTS "space_members_select" ON public.space_members;
DROP POLICY IF EXISTS "space_members_update" ON public.space_members;
DROP POLICY IF EXISTS "space_members_delete" ON public.space_members;

-- ==========================================
-- Step 2: Create a SECURITY DEFINER function
-- This function bypasses RLS to check membership
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT space_id FROM public.space_members WHERE user_id = auth.uid();
$$;

-- ==========================================
-- Step 3: Create non-recursive policies
-- ==========================================

-- SELECT: Users can read their own row (always safe, no recursion)
-- PLUS all members of spaces they belong to (via function)
CREATE POLICY "space_members_select"
  ON public.space_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    space_id IN (SELECT public.get_my_space_ids())
  );

-- INSERT: Any authenticated user can insert themselves
-- (needed for creating/joining spaces)
CREATE POLICY "space_members_insert"
  ON public.space_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Only owner/admin of that space can update roles
CREATE POLICY "space_members_update"
  ON public.space_members FOR UPDATE
  USING (
    space_id IN (
      SELECT public.get_my_space_ids()
    )
    AND EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_members.space_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- DELETE: Only owner/admin can remove others (not themselves)
CREATE POLICY "space_members_delete"
  ON public.space_members FOR DELETE
  USING (
    space_id IN (
      SELECT public.get_my_space_ids()
    )
    AND user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_members.space_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- Step 4: Also fix spaces table policies
-- ==========================================
DROP POLICY IF EXISTS "Spaces: members can read" ON public.spaces;
DROP POLICY IF EXISTS "spaces_select" ON public.spaces;
DROP POLICY IF EXISTS "spaces_insert" ON public.spaces;

-- SELECT: Users can read spaces they are members of
CREATE POLICY "spaces_select"
  ON public.spaces FOR SELECT
  USING (
    id IN (SELECT public.get_my_space_ids())
    OR created_by = auth.uid()
  );

-- INSERT: Any authenticated user can create a space
CREATE POLICY "spaces_insert"
  ON public.spaces FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

-- ==========================================
-- DONE! Infinite recursion fixed.
-- ==========================================
