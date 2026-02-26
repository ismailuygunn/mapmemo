-- ═══════════════════════════════════════════
-- Migration V4: Trip Photos / Gallery
-- ═══════════════════════════════════════════

-- Trip photos table
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

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_trip_photos_trip ON public.trip_photos(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_photos_space ON public.trip_photos(space_id);

-- Enable RLS
ALTER TABLE public.trip_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view photos in their space"
  ON public.trip_photos FOR SELECT
  USING (
    space_id IN (
      SELECT space_id FROM public.space_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos in their space"
  ON public.trip_photos FOR INSERT
  WITH CHECK (
    space_id IN (
      SELECT space_id FROM public.space_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos in their space"
  ON public.trip_photos FOR UPDATE
  USING (
    space_id IN (
      SELECT space_id FROM public.space_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos in their space"
  ON public.trip_photos FOR DELETE
  USING (
    space_id IN (
      SELECT space_id FROM public.space_members WHERE user_id = auth.uid()
    )
  );

-- Add cover_photo_url column to trips if not exists
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cover_photo_url text;

-- Storage bucket for trip photos (run this in Supabase Dashboard > Storage)
-- CREATE BUCKET: trip-photos (public)
