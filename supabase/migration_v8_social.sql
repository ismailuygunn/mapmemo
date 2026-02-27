-- ═══════════════════════════════════════════════════════════════
-- Migration v8: Social Features — Phase 1
-- ═══════════════════════════════════════════════════════════════
-- Swarm + Stories hybrid social platform
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- ══════════════════════════════════
-- 1. PROFILES — add social fields
-- ══════════════════════════════════
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS checkin_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Auto-generate usernames from display_name for existing users
UPDATE public.profiles
SET username = lower(replace(replace(coalesce(display_name, split_part(email, '@', 1)), ' ', '_'), '.', '_')) || '_' || substr(id::text, 1, 4)
WHERE username IS NULL;

-- ══════════════════════════════════
-- 2. FOLLOWS table
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS public.follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (follower_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ══════════════════════════════════
-- 3. CHECK_INS table (Swarm-style)
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS public.check_ins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_name text NOT NULL,
    city text,
    country text,
    lat double precision,
    lng double precision,
    note text,
    photo_url text,
    emoji text DEFAULT '📍',
    category text DEFAULT 'other', -- cafe, restaurant, museum, park, bar, hotel, landmark, other
    rating integer CHECK (rating >= 1 AND rating <= 5),
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_select" ON public.check_ins FOR SELECT
  USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "checkins_insert" ON public.check_ins FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "checkins_update" ON public.check_ins FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "checkins_delete" ON public.check_ins FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_checkins_user ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_city ON public.check_ins(city);
CREATE INDEX IF NOT EXISTS idx_checkins_created ON public.check_ins(created_at DESC);

-- ══════════════════════════════════
-- 4. STORIES table (24h expiry)
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'checkin', -- checkin, trip, plan, text
    content text,
    media_url text,
    city text,
    emoji text DEFAULT '✈️',
    bg_color text DEFAULT '#4F46E5',
    checkin_id uuid REFERENCES public.check_ins(id) ON DELETE SET NULL,
    trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
    view_count integer DEFAULT 0,
    expires_at timestamptz DEFAULT (now() + interval '24 hours'),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "stories_delete" ON public.stories FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);

-- ══════════════════════════════════
-- 5. FEED_LIKES table
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS public.feed_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type text NOT NULL, -- 'check_in', 'story', 'trip'
    target_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.feed_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "likes_delete" ON public.feed_likes FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_likes_target ON public.feed_likes(target_type, target_id);

-- ══════════════════════════════════
-- 6. FEED_COMMENTS table
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS public.feed_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.feed_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_update" ON public.feed_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "comments_delete" ON public.feed_comments FOR DELETE USING (user_id = auth.uid());

-- ══════════════════════════════════
-- 7. HELPER FUNCTIONS
-- ══════════════════════════════════

-- Auto-update follower/following counts via trigger
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE profiles SET follower_count = COALESCE(follower_count, 0) + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
        UPDATE profiles SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0) WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_follow_counts ON public.follows;
CREATE TRIGGER trigger_follow_counts
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Auto-update checkin count
CREATE OR REPLACE FUNCTION public.update_checkin_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET checkin_count = COALESCE(checkin_count, 0) + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET checkin_count = GREATEST(COALESCE(checkin_count, 0) - 1, 0) WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_checkin_count ON public.check_ins;
CREATE TRIGGER trigger_checkin_count
    AFTER INSERT OR DELETE ON public.check_ins
    FOR EACH ROW EXECUTE FUNCTION public.update_checkin_count();

-- ═══════════════════════════════════════════════════════════════
-- DONE! Social tables ready.
-- ═══════════════════════════════════════════════════════════════
-- Verify: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
