-- ═══════════════════════════════════════════════════
-- MapMemo: Onboarding & Profiles Fix
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- Birden fazla kez çalıştırmak güvenlidir
-- ═══════════════════════════════════════════════════

-- 1. profiles tablosuna eksik sütunları ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. RLS politikalarını düzelt (profiles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. RLS politikalarını düzelt (spaces) - basit, recursion-free
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spaces_select" ON public.spaces;
CREATE POLICY "spaces_select" ON public.spaces
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "spaces_insert" ON public.spaces;
CREATE POLICY "spaces_insert" ON public.spaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "spaces_update" ON public.spaces;
CREATE POLICY "spaces_update" ON public.spaces
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "spaces_delete" ON public.spaces;
CREATE POLICY "spaces_delete" ON public.spaces
  FOR DELETE USING (auth.uid() = created_by);

-- 4. RLS politikalarını düzelt (space_members) - BASIT, recursion yok!
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "space_members_select" ON public.space_members;
CREATE POLICY "space_members_select" ON public.space_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "space_members_insert" ON public.space_members;
CREATE POLICY "space_members_insert" ON public.space_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "space_members_update" ON public.space_members;
CREATE POLICY "space_members_update" ON public.space_members
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "space_members_delete" ON public.space_members;
CREATE POLICY "space_members_delete" ON public.space_members
  FOR DELETE USING (auth.uid() = user_id);

-- 5. trips tablosu RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select" ON public.trips;
CREATE POLICY "trips_select" ON public.trips
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "trips_insert" ON public.trips;
CREATE POLICY "trips_insert" ON public.trips
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "trips_update" ON public.trips;
CREATE POLICY "trips_update" ON public.trips
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "trips_delete" ON public.trips;
CREATE POLICY "trips_delete" ON public.trips
  FOR DELETE USING (true);

-- 6. Mevcut kullanıcı profilini kontrol et / oluştur
-- (auth.users tablosundan profil yoksa otomatik oluşturur)
INSERT INTO public.profiles (id, email, full_name, display_name, onboarding_completed)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  false
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

SELECT 'Tamamlandı! ✅ Şimdi uygulamaya geri dön ve sayfayı yenile.' AS sonuc;
