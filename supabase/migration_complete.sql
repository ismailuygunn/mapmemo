-- ═══════════════════════════════════════════════════════════════
-- MapMemo — COMPLETE Database Setup
-- ═══════════════════════════════════════════════════════════════
-- Tek seferde Supabase Dashboard → SQL Editor → Paste → Run
-- Bu dosya TÜM migration'ları birleştirir (v1 → v7 + RLS fix)
-- Güvenle tekrar çalıştırılabilir (IF NOT EXISTS kullanılır)
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════
-- 1. PROFILES
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  full_name text,
  email text,
  avatar_url text,
  home_city text,
  bio text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, onboarding_completed)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ══════════════════════════════════════════
-- 2. SPACES (Travel Groups)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.spaces (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  invite_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════
-- 3. SPACE MEMBERS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.space_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- ══════════════════════════════════════════
-- 4. PINS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.pins (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users,
  title text NOT NULL,
  type text DEFAULT 'memory' CHECK (type IN ('food','view','activity','hotel','memory','photospot','transport','warning')),
  status text DEFAULT 'visited' CHECK (status IN ('visited','planned','wishlist')),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  city text,
  country text,
  notes text,
  tags text[] DEFAULT '{}',
  rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  date_visited date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════
-- 5. PIN MEDIA
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.pin_media (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id uuid REFERENCES public.pins ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  type text DEFAULT 'image' CHECK (type IN ('image', 'video')),
  caption text,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════
-- 6. TRIPS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE NOT NULL,
  city text NOT NULL,
  country text,
  slogan text,
  start_date date,
  end_date date,
  nights integer DEFAULT 1,
  tempo text,
  budget text,
  notes text,
  hero_image_url text,
  cover_photo_url text,
  itinerary_data jsonb,
  surprise_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════
-- 7. TRIP SPOTS (Places to visit)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trip_spots (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  place_id text,
  name text NOT NULL,
  category text,
  address text,
  lat double precision,
  lng double precision,
  photo_url text,
  photos jsonb DEFAULT '[]'::jsonb,
  rating numeric(3,1),
  review_count integer,
  opening_hours jsonb,
  description text,
  external_url text,
  is_planned boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  visit_date date,
  user_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_spots_trip ON public.trip_spots(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_spots_space ON public.trip_spots(space_id);

-- ══════════════════════════════════════════
-- 8. TRIP STAYS (Hotel bookings)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trip_stays (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  provider text,
  hotel_name text,
  address text,
  lat double precision,
  lng double precision,
  check_in date,
  check_out date,
  confirmation_code text,
  booking_url text,
  photo_url text,
  price_total numeric(10,2),
  currency text DEFAULT 'TRY',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_stays_trip ON public.trip_stays(trip_id);

-- ══════════════════════════════════════════
-- 9. TRIP PHOTOS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trip_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  lat double precision,
  lng double precision,
  location_name text,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_photos_trip ON public.trip_photos(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_photos_space ON public.trip_photos(space_id);

-- ══════════════════════════════════════════
-- 10. TRIP VOTES
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trip_votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  item_key text NOT NULL,
  vote text CHECK (vote IN ('up', 'down', 'neutral')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, user_id, item_key)
);

-- ══════════════════════════════════════════
-- 11. MEMORY CAPSULES
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.memory_capsules (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  message text,
  media_urls text[] DEFAULT '{}',
  reveal_date date NOT NULL,
  is_revealed boolean DEFAULT false,
  revealed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════
-- 12. PRICE ALERTS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  origin_code text NOT NULL,
  destination_code text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  target_price numeric,
  currency text DEFAULT 'TRY',
  last_price numeric,
  last_checked timestamptz,
  is_active boolean DEFAULT true,
  is_triggered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════
-- 13. MEETUPS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  city text,
  lat double precision,
  lng double precision,
  location_name text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  external_link text,
  cover_url text,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetups_space ON public.meetups(space_id);
CREATE INDEX IF NOT EXISTS idx_meetups_start ON public.meetups(start_time);

-- ══════════════════════════════════════════
-- 14. MEETUP RSVPS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.meetup_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('going', 'maybe', 'late', 'not_going')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(meetup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_meetup ON public.meetup_rsvps(meetup_id);

-- ══════════════════════════════════════════
-- 15. MEETUP TIMELINE
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.meetup_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  time text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_meetup ON public.meetup_timeline(meetup_id);

-- ══════════════════════════════════════════
-- 16. MEETUP UPDATES
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.meetup_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('created', 'location_changed', 'time_changed', 'description_changed', 'cancelled', 'rsvp', 'timeline_updated')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_updates_meetup ON public.meetup_updates(meetup_id);

-- ══════════════════════════════════════════
-- 17. STORAGE BUCKET
-- ══════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-media', 'pin-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (safe to re-run)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pin_media_storage_upload' AND tablename = 'objects') THEN
    CREATE POLICY "pin_media_storage_upload" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'pin-media' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pin_media_storage_read' AND tablename = 'objects') THEN
    CREATE POLICY "pin_media_storage_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'pin-media');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pin_media_storage_delete' AND tablename = 'objects') THEN
    CREATE POLICY "pin_media_storage_delete" ON storage.objects FOR DELETE
      USING (bucket_id = 'pin-media' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 18. RLS — Enable on ALL tables
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_updates ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- 19. DROP ALL EXISTING POLICIES (clean slate)
-- ═══════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════
-- 20. HELPER FUNCTIONS (SECURITY DEFINER = bypasses RLS)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT space_id FROM space_members WHERE user_id = auth.uid();
$$;

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

-- ═══════════════════════════════════════════════════════════════
-- 21. RLS POLICIES (non-recursive, using helper functions)
-- ═══════════════════════════════════════════════════════════════

-- ── profiles ──
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ── space_members ──
CREATE POLICY "sm_select" ON public.space_members FOR SELECT
  USING (user_id = auth.uid() OR space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "sm_insert" ON public.space_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "sm_update" ON public.space_members FOR UPDATE
  USING (is_space_admin(space_id));
CREATE POLICY "sm_delete" ON public.space_members FOR DELETE
  USING (is_space_admin(space_id) AND user_id != auth.uid());

-- ── spaces ──
CREATE POLICY "spaces_select" ON public.spaces FOR SELECT
  USING (id IN (SELECT get_my_space_ids()) OR created_by = auth.uid());
CREATE POLICY "spaces_insert" ON public.spaces FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "spaces_update" ON public.spaces FOR UPDATE
  USING (is_space_admin(id));

-- ── pins ──
CREATE POLICY "pins_select" ON public.pins FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "pins_insert" ON public.pins FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "pins_update" ON public.pins FOR UPDATE
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "pins_delete" ON public.pins FOR DELETE
  USING (space_id IN (SELECT get_my_space_ids()));

-- ── pin_media ──
CREATE POLICY "pin_media_select" ON public.pin_media FOR SELECT
  USING (pin_id IN (SELECT id FROM pins WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "pin_media_insert" ON public.pin_media FOR INSERT
  WITH CHECK (pin_id IN (SELECT id FROM pins WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "pin_media_delete" ON public.pin_media FOR DELETE
  USING (pin_id IN (SELECT id FROM pins WHERE space_id IN (SELECT get_my_space_ids())));

-- ── trips ──
CREATE POLICY "trips_select" ON public.trips FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trips_insert" ON public.trips FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trips_update" ON public.trips FOR UPDATE
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trips_delete" ON public.trips FOR DELETE
  USING (space_id IN (SELECT get_my_space_ids()));

-- ── trip_spots ──
CREATE POLICY "trip_spots_select" ON public.trip_spots FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_spots_insert" ON public.trip_spots FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_spots_update" ON public.trip_spots FOR UPDATE
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_spots_delete" ON public.trip_spots FOR DELETE
  USING (space_id IN (SELECT get_my_space_ids()));

-- ── trip_stays ──
CREATE POLICY "trip_stays_select" ON public.trip_stays FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_stays_insert" ON public.trip_stays FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_stays_update" ON public.trip_stays FOR UPDATE
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_stays_delete" ON public.trip_stays FOR DELETE
  USING (space_id IN (SELECT get_my_space_ids()));

-- ── trip_photos ──
CREATE POLICY "trip_photos_select" ON public.trip_photos FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_photos_insert" ON public.trip_photos FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_photos_update" ON public.trip_photos FOR UPDATE
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_photos_delete" ON public.trip_photos FOR DELETE
  USING (space_id IN (SELECT get_my_space_ids()));

-- ── trip_votes ──
CREATE POLICY "trip_votes_select" ON public.trip_votes FOR SELECT
  USING (trip_id IN (SELECT id FROM trips WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "trip_votes_insert" ON public.trip_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "trip_votes_update" ON public.trip_votes FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "trip_votes_delete" ON public.trip_votes FOR DELETE
  USING (user_id = auth.uid());

-- ── memory_capsules ──
CREATE POLICY "capsules_select" ON public.memory_capsules FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "capsules_insert" ON public.memory_capsules FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "capsules_update" ON public.memory_capsules FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "capsules_delete" ON public.memory_capsules FOR DELETE
  USING (created_by = auth.uid());

-- ── price_alerts ──
CREATE POLICY "alerts_select" ON public.price_alerts FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "alerts_insert" ON public.price_alerts FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "alerts_update" ON public.price_alerts FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "alerts_delete" ON public.price_alerts FOR DELETE
  USING (created_by = auth.uid());

-- ── meetups ──
CREATE POLICY "meetups_select" ON public.meetups FOR SELECT
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "meetups_insert" ON public.meetups FOR INSERT
  WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "meetups_update" ON public.meetups FOR UPDATE
  USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "meetups_delete" ON public.meetups FOR DELETE
  USING (is_space_admin(space_id));

-- ── meetup_rsvps ──
CREATE POLICY "rsvps_select" ON public.meetup_rsvps FOR SELECT
  USING (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "rsvps_insert" ON public.meetup_rsvps FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rsvps_update" ON public.meetup_rsvps FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "rsvps_delete" ON public.meetup_rsvps FOR DELETE
  USING (user_id = auth.uid());

-- ── meetup_timeline ──
CREATE POLICY "timeline_select" ON public.meetup_timeline FOR SELECT
  USING (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "timeline_insert" ON public.meetup_timeline FOR INSERT
  WITH CHECK (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "timeline_update" ON public.meetup_timeline FOR UPDATE
  USING (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "timeline_delete" ON public.meetup_timeline FOR DELETE
  USING (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));

-- ── meetup_updates ──
CREATE POLICY "mupdates_select" ON public.meetup_updates FOR SELECT
  USING (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));
CREATE POLICY "mupdates_insert" ON public.meetup_updates FOR INSERT
  WITH CHECK (meetup_id IN (SELECT id FROM meetups WHERE space_id IN (SELECT get_my_space_ids())));

-- ═══════════════════════════════════════════════════════════════
-- ✅ DONE! Veritabanı tamamen hazır.
-- ═══════════════════════════════════════════════════════════════
-- 16 tablo + RLS + helper functions + storage bucket
-- Tek seferde çalıştırıldı.
-- ═══════════════════════════════════════════════════════════════
