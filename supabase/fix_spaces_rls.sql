-- ═══════════════════════════════════════════════════
-- FIX: Complete RLS policies for spaces, trips, pins
-- Missing INSERT/UPDATE/DELETE policies prevent
-- saving SOS plans, creating groups, etc.
-- ═══════════════════════════════════════════════════

-- ═══ ENSURE HELPER FUNCTION EXISTS ═══
CREATE OR REPLACE FUNCTION public.user_space_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT space_id FROM public.space_members WHERE user_id = uid;
$$;

-- ═══════════════════════════════════════════════════
-- SPACES TABLE — full CRUD
-- ═══════════════════════════════════════════════════
DROP POLICY IF EXISTS "spaces_select" ON public.spaces;
DROP POLICY IF EXISTS "spaces_insert" ON public.spaces;
DROP POLICY IF EXISTS "spaces_update" ON public.spaces;
DROP POLICY IF EXISTS "spaces_delete" ON public.spaces;
DROP POLICY IF EXISTS "Spaces: members can read" ON public.spaces;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "spaces_delete" ON public.spaces
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- ═══════════════════════════════════════════════════
-- SPACE_MEMBERS TABLE — full CRUD
-- ═══════════════════════════════════════════════════
DROP POLICY IF EXISTS "space_members_select" ON public.space_members;
DROP POLICY IF EXISTS "space_members_insert" ON public.space_members;
DROP POLICY IF EXISTS "space_members_update" ON public.space_members;
DROP POLICY IF EXISTS "space_members_delete" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: members can read" ON public.space_members;
DROP POLICY IF EXISTS "Space Members: users can read own membership" ON public.space_members;
DROP POLICY IF EXISTS "Members can read own memberships" ON public.space_members;
DROP POLICY IF EXISTS "Members can read co-members" ON public.space_members;

ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_members_select" ON public.space_members
  FOR SELECT USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

CREATE POLICY "space_members_insert" ON public.space_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "space_members_update" ON public.space_members
  FOR UPDATE USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

CREATE POLICY "space_members_delete" ON public.space_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- ═══════════════════════════════════════════════════
-- TRIPS TABLE — full CRUD (SOS plans saved here)
-- ═══════════════════════════════════════════════════
DROP POLICY IF EXISTS "trips_select" ON public.trips;
DROP POLICY IF EXISTS "trips_insert" ON public.trips;
DROP POLICY IF EXISTS "trips_update" ON public.trips;
DROP POLICY IF EXISTS "trips_delete" ON public.trips;
DROP POLICY IF EXISTS "Trips: space members can read" ON public.trips;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- SELECT: members of the space can read
CREATE POLICY "trips_select" ON public.trips
  FOR SELECT USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- INSERT: members of the space can create trips/plans
CREATE POLICY "trips_insert" ON public.trips
  FOR INSERT WITH CHECK (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- UPDATE: members of the space can update
CREATE POLICY "trips_update" ON public.trips
  FOR UPDATE USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- DELETE: members of the space can delete
CREATE POLICY "trips_delete" ON public.trips
  FOR DELETE USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

-- ═══════════════════════════════════════════════════
-- PINS TABLE — full CRUD
-- ═══════════════════════════════════════════════════
DROP POLICY IF EXISTS "pins_select" ON public.pins;
DROP POLICY IF EXISTS "pins_insert" ON public.pins;
DROP POLICY IF EXISTS "pins_update" ON public.pins;
DROP POLICY IF EXISTS "pins_delete" ON public.pins;
DROP POLICY IF EXISTS "Pins: space members can read" ON public.pins;

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pins_select" ON public.pins
  FOR SELECT USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

CREATE POLICY "pins_insert" ON public.pins
  FOR INSERT WITH CHECK (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

CREATE POLICY "pins_update" ON public.pins
  FOR UPDATE USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

CREATE POLICY "pins_delete" ON public.pins
  FOR DELETE USING (
    space_id IN (SELECT public.user_space_ids(auth.uid()))
  );

SELECT 'All RLS policies (spaces, space_members, trips, pins) created successfully — INSERT/UPDATE/DELETE included' as status;
