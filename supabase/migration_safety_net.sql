-- ═══════════════════════════════════════════════════════════════
-- SAFETY NET MIGRATION — Run this to ensure EVERYTHING works
-- ═══════════════════════════════════════════════════════════════
-- Supabase Dashboard → SQL Editor → New Query → Paste ALL → Run
-- This is SAFE to run multiple times (uses IF NOT EXISTS everywhere)

-- ══════════════ PROFILES TABLE ══════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  full_name text,
  home_city text,
  bio text,
  avatar_url text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add any missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- ══════════════ SPACES TABLE ══════════════
CREATE TABLE IF NOT EXISTS public.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  invite_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ══════════════ SPACE_MEMBERS TABLE ══════════════
CREATE TABLE IF NOT EXISTS public.space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- ══════════════ TRIPS TABLE ══════════════
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE,
  city text,
  start_date date,
  end_date date,
  notes text,
  cover_url text,
  itinerary_data jsonb,
  tempo text,
  budget text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS itinerary_data jsonb;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS tempo text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- ══════════════ TRIP_SPOTS TABLE ══════════════
CREATE TABLE IF NOT EXISTS public.trip_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  name text,
  description text,
  lat double precision,
  lng double precision,
  category text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ══════════════ HELPER FUNCTIONS ══════════════
CREATE OR REPLACE FUNCTION public.get_my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT space_id FROM space_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_space_member(check_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM space_members WHERE space_id = check_space_id AND user_id = auth.uid());
$$;

-- ══════════════ ENABLE RLS ══════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_spots ENABLE ROW LEVEL SECURITY;

-- ══════════════ DROP OLD POLICIES (safe) ══════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','spaces','space_members','trips','trip_spots')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ══════════════ PROFILES POLICIES ══════════════
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ══════════════ SPACES POLICIES ══════════════
CREATE POLICY "spaces_select" ON public.spaces FOR SELECT USING (true);
CREATE POLICY "spaces_insert" ON public.spaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "spaces_update" ON public.spaces FOR UPDATE USING (created_by = auth.uid());

-- ══════════════ SPACE_MEMBERS POLICIES ══════════════
CREATE POLICY "sm_select" ON public.space_members FOR SELECT USING (user_id = auth.uid() OR space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "sm_insert" ON public.space_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sm_update" ON public.space_members FOR UPDATE USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "sm_delete" ON public.space_members FOR DELETE USING (space_id IN (SELECT get_my_space_ids()));

-- ══════════════ TRIPS POLICIES ══════════════
CREATE POLICY "trips_select" ON public.trips FOR SELECT USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trips_insert" ON public.trips FOR INSERT WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trips_update" ON public.trips FOR UPDATE USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trips_delete" ON public.trips FOR DELETE USING (space_id IN (SELECT get_my_space_ids()));

-- ══════════════ TRIP_SPOTS POLICIES ══════════════
CREATE POLICY "ts_select" ON public.trip_spots FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE space_id IN (SELECT get_my_space_ids()))
);
CREATE POLICY "ts_insert" ON public.trip_spots FOR INSERT WITH CHECK (
  trip_id IN (SELECT id FROM trips WHERE space_id IN (SELECT get_my_space_ids()))
);
CREATE POLICY "ts_update" ON public.trip_spots FOR UPDATE USING (
  trip_id IN (SELECT id FROM trips WHERE space_id IN (SELECT get_my_space_ids()))
);
CREATE POLICY "ts_delete" ON public.trip_spots FOR DELETE USING (
  trip_id IN (SELECT id FROM trips WHERE space_id IN (SELECT get_my_space_ids()))
);

-- ══════════════ AUTO-CREATE PROFILE ON SIGNUP ══════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ══════════════ DONE ══════════════
-- All tables, columns, policies, and triggers are now in place.
-- You can safely run this migration multiple times.
