-- ═══════════════════════════════════════════════════
-- FIX: space_members RLS infinite recursion
-- Root cause: policy queries space_members to check
-- if user can read space_members = infinite loop
-- ═══════════════════════════════════════════════════

-- Step 1: Create a SECURITY DEFINER function to check membership
-- This bypasses RLS, preventing the recursion loop
CREATE OR REPLACE FUNCTION public.user_space_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT space_id FROM public.space_members WHERE user_id = uid;
$$;

-- Step 2: Drop ALL existing space_members policies
DROP POLICY IF EXISTS "Space Members: members can read" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: users can read own membership" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: owners can update" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: owners can delete" ON public.space_members;
DROP POLICY IF EXISTS "Members can read own memberships" ON public.space_members;
DROP POLICY IF EXISTS "Members can read co-members" ON public.space_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.space_members;
DROP POLICY IF EXISTS "space_members_select" ON public.space_members;
DROP POLICY IF EXISTS "space_members_insert" ON public.space_members;
DROP POLICY IF EXISTS "space_members_update" ON public.space_members;
DROP POLICY IF EXISTS "space_members_delete" ON public.space_members;

-- Step 3: Recreate policies using the SECURITY DEFINER function
-- SELECT: Users can read memberships of spaces they belong to
CREATE POLICY "space_members_select" ON public.space_members
  FOR SELECT USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- INSERT: Users can add themselves as members
CREATE POLICY "space_members_insert" ON public.space_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Space owners/admins can update member roles
CREATE POLICY "space_members_update" ON public.space_members
  FOR UPDATE USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_members.space_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- DELETE: Space owners can remove members, or users can remove themselves
CREATE POLICY "space_members_delete" ON public.space_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR (
      space_id IN (SELECT public.user_space_ids(auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = space_members.space_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
      )
    )
  );

-- Step 4: Also fix spaces table policies that reference space_members
DROP POLICY IF EXISTS "Spaces: members can read" ON public.spaces;
DROP POLICY IF EXISTS "spaces_select" ON public.spaces;
DROP POLICY IF EXISTS "spaces_insert" ON public.spaces;
DROP POLICY IF EXISTS "spaces_update" ON public.spaces;

CREATE POLICY "spaces_select" ON public.spaces
  FOR SELECT USING (
    id IN (SELECT public.user_space_ids(auth.uid()))
    OR created_by = auth.uid()
  );

CREATE POLICY "spaces_insert" ON public.spaces
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "spaces_update" ON public.spaces
  FOR UPDATE USING (
    created_by = auth.uid()
    OR id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- Step 5: Fix other tables that reference space_members in their RLS
-- These also cause recursion because they do: space_id IN (SELECT space_id FROM space_members WHERE ...)
-- Replace with the SECURITY DEFINER function

-- Trips
DROP POLICY IF EXISTS "Trips: space members can read" ON public.trips;
DROP POLICY IF EXISTS "trips_select" ON public.trips;
CREATE POLICY "trips_select" ON public.trips
  FOR SELECT USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- Pins
DROP POLICY IF EXISTS "Pins: space members can read" ON public.pins;
DROP POLICY IF EXISTS "pins_select" ON public.pins;  
CREATE POLICY "pins_select" ON public.pins
  FOR SELECT USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

SELECT 'RLS fix completed successfully' as status;
