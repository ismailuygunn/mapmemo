-- ═══════════════════════════════════════════════════════════════
-- Fix: Add Foreign Key relationships from social tables to profiles
-- ═══════════════════════════════════════════════════════════════
-- The check_ins, stories, follows, feed_likes and feed_comments tables
-- reference auth.users(id) but not profiles(id). PostgREST needs explicit
-- foreign keys to profiles for embedded queries to work.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. check_ins → profiles
ALTER TABLE public.check_ins
  DROP CONSTRAINT IF EXISTS check_ins_user_id_profiles_fkey;
ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. stories → profiles
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_user_id_profiles_fkey;
ALTER TABLE public.stories
  ADD CONSTRAINT stories_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. feed_likes → profiles
ALTER TABLE public.feed_likes
  DROP CONSTRAINT IF EXISTS feed_likes_user_id_profiles_fkey;
ALTER TABLE public.feed_likes
  ADD CONSTRAINT feed_likes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. feed_comments → profiles
ALTER TABLE public.feed_comments
  DROP CONSTRAINT IF EXISTS feed_comments_user_id_profiles_fkey;
ALTER TABLE public.feed_comments
  ADD CONSTRAINT feed_comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. follows → profiles (both directions)
-- follower → profiles
ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_follower_id_profiles_fkey;
ALTER TABLE public.follows
  ADD CONSTRAINT follows_follower_id_profiles_fkey
  FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- following → profiles
ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_following_id_profiles_fkey;
ALTER TABLE public.follows
  ADD CONSTRAINT follows_following_id_profiles_fkey
  FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- DONE! FK relationships added so joins like:
--   .select('*, profiles(id, display_name, ...)')
-- will now work correctly.
-- ═══════════════════════════════════════════════════════════════
