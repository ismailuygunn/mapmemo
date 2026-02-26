-- ═══════════════════════════════════════════════════════════════
-- Migration v7: Trip Details (Spots, Notes, Stays)
-- Polarsteps-style trip planning system
-- ═══════════════════════════════════════════════════════════════
-- Run in Supabase Dashboard → SQL Editor

-- Extend trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS nights integer DEFAULT 1;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS slogan text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS notes text;

-- ── TRIP SPOTS ──
CREATE TABLE IF NOT EXISTS public.trip_spots (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
    place_id text, -- Google Places ID
    name text NOT NULL,
    category text, -- MUSEUMS, SIGHTS & LANDMARKS, etc.
    address text,
    lat double precision,
    lng double precision,
    photo_url text,
    photos jsonb DEFAULT '[]'::jsonb, -- array of photo URLs
    rating numeric(3,1),
    review_count integer,
    opening_hours jsonb, -- { today: "09:00 - 18:00", periods: [...] }
    description text,
    external_url text, -- link to Google Maps / TripAdvisor
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

-- ── TRIP STAYS ──
CREATE TABLE IF NOT EXISTS public.trip_stays (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
    provider text, -- booking, airbnb, hostelworld, manual
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

-- ── RLS ──
ALTER TABLE public.trip_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stays ENABLE ROW LEVEL SECURITY;

-- trip_spots policies
CREATE POLICY "trip_spots_select" ON public.trip_spots FOR SELECT
    USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_spots_insert" ON public.trip_spots FOR INSERT
    WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_spots_update" ON public.trip_spots FOR UPDATE
    USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_spots_delete" ON public.trip_spots FOR DELETE
    USING (space_id IN (SELECT get_my_space_ids()));

-- trip_stays policies
CREATE POLICY "trip_stays_select" ON public.trip_stays FOR SELECT
    USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_stays_insert" ON public.trip_stays FOR INSERT
    WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_stays_update" ON public.trip_stays FOR UPDATE
    USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_stays_delete" ON public.trip_stays FOR DELETE
    USING (space_id IN (SELECT get_my_space_ids()));

-- ═══════════════════════════════════════════════════════════════
-- DONE! Run fix_rls_v3.sql first if get_my_space_ids() doesn't exist.
-- ═══════════════════════════════════════════════════════════════
