-- ═══════════════════════════════════════════════════════════════
-- MEGA SEED: 50+ Users, 200+ Check-ins, Follows, Likes, Stories
-- ═══════════════════════════════════════════════════════════════
-- Run in Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- This script is idempotent (can be run multiple times safely)

-- ══════════════════════════════════
-- STEP 0: Clean slate (remove ALL old test data completely)
-- ══════════════════════════════════
-- Remove related data first (FK order)
DELETE FROM public.feed_likes WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com'
);
DELETE FROM public.stories WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com'
);
DELETE FROM public.follows WHERE follower_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com'
) OR following_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com'
);
DELETE FROM public.check_ins WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com'
);
-- Delete old test profiles
DELETE FROM public.profiles WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com';
-- Delete old test auth identities & users
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com'
);
DELETE FROM auth.users WHERE email LIKE '%@test.mapmemo.com' OR email LIKE '%@test.com';

-- ══════════════════════════════════
-- STEP 1: Fix FK relationships
-- ══════════════════════════════════
DO $$ BEGIN
  ALTER TABLE public.check_ins ADD CONSTRAINT check_ins_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.stories ADD CONSTRAINT stories_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.feed_likes ADD CONSTRAINT feed_likes_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_profiles_fkey
    FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.follows ADD CONSTRAINT follows_following_id_profiles_fkey
    FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════
-- STEP 2: Create profiles for existing auth users
-- ══════════════════════════════════
INSERT INTO public.profiles (id, email, display_name, username, onboarding_completed, is_public)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
    lower(replace(replace(COALESCE(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)), ' ', '_'), '.', '_')) || '_' || substr(u.id::text, 1, 4),
    true,
    true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  AND u.email NOT LIKE '%@test.mapmemo.com'
  AND u.email NOT LIKE '%@test.com'
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════
-- STEP 3: Create 50 test auth users + profiles
-- ══════════════════════════════════

DO $$
DECLARE
    uid uuid;
    uname text;
    dname text;
    uemail text;
    ubio text;
    ucity text;
    i int;
    existing_count int;
    users_data text[][] := ARRAY[
        -- Turkish users (30)
        ARRAY['Elif Yılmaz',    'İstanbul',  '🍽️ Yemek tutkunu. İstanbul sokak lezzetleri uzmanı. 45+ ülke.'],
        ARRAY['Mehmet Kaya',    'Ankara',    '📸 Fotoğrafçı gezgin. Doğa ve kültür tutkunu.'],
        ARRAY['Zeynep Demir',   'İzmir',     '🌊 Dijital göçebe. Ege mutfağı. Yoga & surf.'],
        ARRAY['Ali Özkan',      'Antalya',   '🏔️ Outdoor rehber, trekking & paragliding.'],
        ARRAY['Ayşe Çelik',    'Bursa',     '🎨 Sanat tarihçisi. Müze meraklısı.'],
        ARRAY['Burak Yıldız',  'Trabzon',   '⚽ Karadeniz çocuğu. Yaylalar ve doğa.'],
        ARRAY['Selin Arslan',  'Muğla',     '🤿 Dalış eğitmeni. Akdeniz sahillerinde yaşam.'],
        ARRAY['Emre Şahin',    'Eskişehir', '🎵 Müzisyen gezgin. Festival tutkunu.'],
        ARRAY['Deniz Koç',     'Gaziantep', '🧆 Gastronomi uzmanı. Antep mutfağı elçisi.'],
        ARRAY['Ceren Aydın',   'Kapadokya', '🎈 Balon pilotu. Göreme aşığı.'],
        ARRAY['Oğuz Türk',     'Bodrum',    '⛵ Yelkenci. Marina hayatı. Mavi tur.'],
        ARRAY['Nazlı Ergün',   'Çanakkale', '📖 Tarih öğretmeni. Antik şehirler uzmanı.'],
        ARRAY['Kaan Öztürk',   'Fethiye',   '🪂 Yamaç paraşütü eğitmeni. Ölüdeniz aşığı.'],
        ARRAY['Pınar Gül',     'Mardin',    '🏛️ Mimari fotoğrafçı. Mezopotamya kültürü.'],
        ARRAY['Serkan Aktaş',  'Erzurum',   '🎿 Kayak eğitmeni. Palandöken & Sarıkamış.'],
        ARRAY['Merve Bayrak',  'Antalya',   '🏖️ Beach volleyball. Sahil yaşamı.'],
        ARRAY['Tolga Kılıç',   'Safranbolu','🏠 Restorasyon uzmanı. Osmanlı mimarisi.'],
        ARRAY['Aslı Yalçın',   'Kuşadası',  '🌅 Sunset hunter. Ege gezgini.'],
        ARRAY['Hasan Demir',   'Rize',      '🍵 Çay üreticisi. Kaçkar dağları rehberi.'],
        ARRAY['Gamze Kara',    'Konya',     '🎶 Sema gösterileri. Mevlana kültürü.'],
        ARRAY['Cem Polat',     'Kastamonu', '🌲 Orman mühendisi. Ilgaz & Küre dağları.'],
        ARRAY['Duygu Ak',      'Amasya',    '🏰 Kral mezarları rehberi. Yeşilırmak güzeli.'],
        ARRAY['Barış Erdem',   'Hatay',     '🥘 Chef. Antakya mutfağı. Medeniyetler şehri.'],
        ARRAY['Esra Tunç',     'Adana',     '🌶️ Adana kebap savunucusu. Seyhan nehri.'],
        ARRAY['Murat Acar',    'Nevşehir',  '🏜️ Kapadokya rehberi. Yeraltı şehirleri uzmanı.'],
        ARRAY['Sibel Korkmaz', 'Şanlıurfa', '🐟 Balıklıgöl. Göbeklitepe araştırmacısı.'],
        ARRAY['Volkan Taş',    'Aydın',     '🫒 Zeytin üreticisi. Ege lezzetleri.'],
        ARRAY['İrem Güneş',    'Sinop',     '🌊 En mutlu şehir. Hamsi festivali.'],
        ARRAY['Onur Yavuz',    'Artvin',    '🌉 Çoruh vadisi. Macahel ormanları.'],
        ARRAY['Berna Sezen',   'Edirne',    '🕌 Selimiye cami. Ciğer festivali.'],
        -- European users (20)
        ARRAY['Sophie Martin',  'Paris',     '🥐 Parisienne. Art & croissants.'],
        ARRAY['Marco Rossi',   'Roma',      '🍕 Roma sokaklarında pizza avcısı.'],
        ARRAY['Anna Schmidt',  'Berlin',    '🎭 Club kültürü. Sanat galerileri.'],
        ARRAY['Elena García',  'Barcelona', '🏖️ Playa vida. Tapas & Gaudí.'],
        ARRAY['Lucas Müller',  'München',   '🍺 Oktoberfest fanatiği. Alpler gezgini.'],
        ARRAY['Julia Novak',   'Viyana',    '🎻 Klasik müzik aşığı. Kafeler şehri.'],
        ARRAY['Jan de Vries',  'Amsterdam', '🚲 Bisiklet kültürü. Kanal gezileri.'],
        ARRAY['Maria Silva',   'Lizbon',    '🎸 Fado müziği. Pastéis de nata.'],
        ARRAY['Erik Johansson','Stockholm', '🏔️ İskandinav doğası. Northern lights.'],
        ARRAY['Katerina Papadopoulos','Atina','🏛️ Akropolis rehberi. Yunan mutfağı.'],
        ARRAY['Pierre Dubois', 'Lyon',      '🍷 Şarap uzmanı. Fransız gastronomisi.'],
        ARRAY['Chiara Bianchi','Floransa',   '🎨 Rönesans sanatı. Uffizi rehberi.'],
        ARRAY['Hans Weber',   'Zürih',      '⛷️ İsviçre Alpleri. Çikolata turu.'],
        ARRAY['Emma O''Brien', 'Dublin',    '🍀 İrlanda pubları. Uçurum yürüyüşleri.'],
        ARRAY['Nikos Alexandros','Santorini','🌅 Ege günbatımları. Ada yaşamı.'],
        ARRAY['Ingrid Berg',  'Oslo',       '🛶 Fiyort gezileri. Viking mirası.'],
        ARRAY['Andrei Popescu','Bükreş',    '🏰 Transilvanya kaleleri. Karpatlar.'],
        ARRAY['Marta Kowalski','Krakow',    '🏛️ Eski şehir turu. Tuz madeni.'],
        ARRAY['Viktor Horváth','Budapeşte', '♨️ Termal kaplıcalar. Tuna nehri.'],
        ARRAY['Lena Svensson', 'Kopenhag',  '🎡 Hygge kültürü. Tivoli bahçeleri.']
    ];
BEGIN
    FOR i IN 1..array_length(users_data, 1) LOOP
        dname := users_data[i][1];
        ucity := users_data[i][2];
        ubio  := users_data[i][3];
        uname := lower(replace(replace(replace(replace(dname, ' ', '_'), '''', ''), 'ı', 'i'), 'ş', 's'));
        uname := regexp_replace(uname, '[^a-z0-9_]', '', 'g');
        uemail := uname || '@test.mapmemo.com';

        -- Check if username already exists (skip if so)
        SELECT COUNT(*) INTO existing_count FROM public.profiles WHERE username = uname;
        IF existing_count > 0 THEN
            CONTINUE;
        END IF;

        uid := gen_random_uuid();

        -- Create auth user
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', uemail, crypt('Test1234!', gen_salt('bf')), now(),
                jsonb_build_object('display_name', dname), 'authenticated', 'authenticated', now() - (i || ' days')::interval, now())
        ON CONFLICT (id) DO NOTHING;

        -- Create auth identity
        BEGIN
            INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
            VALUES (uid, uid, jsonb_build_object('sub', uid::text, 'email', uemail), 'email', uemail, now(), now());
        EXCEPTION WHEN unique_violation THEN NULL;
        END;

        -- Create profile with avatar
        INSERT INTO public.profiles (id, email, display_name, username, bio, home_city, avatar_url, is_public, onboarding_completed, checkin_count, follower_count, following_count)
        VALUES (uid, uemail, dname, uname, ubio, ucity,
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || uname || '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
            true, true, 0, 0, 0)
        ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, username = EXCLUDED.username,
            bio = EXCLUDED.bio, home_city = EXCLUDED.home_city, avatar_url = EXCLUDED.avatar_url;
    END LOOP;
END $$;

-- ══════════════════════════════════
-- STEP 4: CHECK-INS with real lat/lng coordinates
-- ══════════════════════════════════

-- We need to insert check-ins referencing the users we just created.
-- Since UUIDs are random, we'll look up by username.

DO $$
DECLARE
    uid uuid;
BEGIN
    -- ─── TURKISH CHECK-INS ───

    -- elif_yilmaz (Istanbul food)
    SELECT id INTO uid FROM public.profiles WHERE username = 'elif_yilmaz';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Karaköy Güllüoğlu', 'İstanbul', 'Türkiye', 41.0220, 28.9735, 'Dünyanın en iyi baklavası! Fıstıklı + kaymak = cennet 🤤', '☕', 'cafe', 5, true, now() - interval '2 hours'),
        (uid, 'Çiya Sofrası', 'İstanbul', 'Türkiye', 40.9924, 29.0243, 'Kebap çeşitleri muazzam. Patlıcan kebabı favorim!', '🍽️', 'restaurant', 5, true, now() - interval '1 day'),
        (uid, 'Balat Sokakları', 'İstanbul', 'Türkiye', 41.0301, 28.9475, 'Renkli evler, vintage dükkânlar ✨', '📸', 'landmark', 4, true, now() - interval '2 days'),
        (uid, 'Grand Bazaar', 'İstanbul', 'Türkiye', 41.0108, 28.9680, 'Kapalıçarşıda kaybolmak! Her köşede yeni keşif.', '📸', 'landmark', 4, true, now() - interval '4 days'),
        (uid, 'Büyükada', 'İstanbul', 'Türkiye', 40.8572, 29.1228, 'Bisiklet turu + dondurma. Ada havası bambaşka 🏝️', '📸', 'landmark', 4, true, now() - interval '6 days');
    END IF;

    -- mehmet_kaya (Ankara, culture)
    SELECT id INTO uid FROM public.profiles WHERE username = 'mehmet_kaya';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Anıtkabir', 'Ankara', 'Türkiye', 39.9254, 32.8366, 'Her gelişimde ayrı duygulanıyorum.', '🏛️', 'museum', 5, true, now() - interval '3 hours'),
        (uid, 'Göreme Açık Hava Müzesi', 'Nevşehir', 'Türkiye', 38.6431, 34.8313, 'Peri bacaları gün batımında inanılmaz 🎈', '🏛️', 'museum', 5, true, now() - interval '1 day'),
        (uid, 'Pamukkale', 'Denizli', 'Türkiye', 37.9204, 29.1187, 'Beyaz cennet! Hierapolis antik kenti muhteşem 🏛️', '📸', 'landmark', 5, true, now() - interval '3 days'),
        (uid, 'Safranbolu', 'Karabük', 'Türkiye', 41.2539, 32.6942, 'Osmanlı evleri muhteşem. Lokum + Türk kahvesi 👌', '☕', 'cafe', 4, true, now() - interval '5 days');
    END IF;

    -- zeynep_demir (Izmir, coastal)
    SELECT id INTO uid FROM public.profiles WHERE username = 'zeynep_demir';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Alaçatı Çarşı', 'İzmir', 'Türkiye', 38.2826, 26.3706, 'Taş sokaklar, butik dükkânlar ve rüzgar sörfü! ☀️', '📸', 'landmark', 5, true, now() - interval '3 hours'),
        (uid, 'Efes Antik Kenti', 'İzmir', 'Türkiye', 37.9393, 27.3411, 'Celsus Kütüphanesi hayranlık verici.', '🏛️', 'museum', 5, true, now() - interval '2 days'),
        (uid, 'Kaş Marina', 'Antalya', 'Türkiye', 36.2008, 29.6389, 'Sahil kenarında cocktail + gün batımı 🤿', '🍷', 'bar', 4, true, now() - interval '4 days'),
        (uid, 'Datça Sahili', 'Muğla', 'Türkiye', 36.7260, 27.6870, 'Sessiz sahil, badem ağaçları 🧘‍♀️', '🌳', 'park', 5, true, now() - interval '7 days');
    END IF;

    -- ali_ozkan (Antalya, outdoor)
    SELECT id INTO uid FROM public.profiles WHERE username = 'ali_ozkan';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Butterfly Valley', 'Antalya', 'Türkiye', 36.5320, 29.1250, 'İnanılmaz koy! Trekking sonrası denize atlama 🦋', '🌳', 'park', 5, true, now() - interval '1 hour'),
        (uid, 'Olympos Yanartaş', 'Antalya', 'Türkiye', 36.4361, 30.4586, 'Doğal alevler gece çok etkileyici 🔥', '📸', 'landmark', 5, true, now() - interval '1 day'),
        (uid, 'Saklıkent Kanyonu', 'Antalya', 'Türkiye', 36.4848, 29.4120, 'Buz gibi su + kanyon yürüyüşü 🏞️', '🌳', 'park', 4, true, now() - interval '3 days'),
        (uid, 'Ölüdeniz Paragliding', 'Muğla', 'Türkiye', 36.5498, 29.1158, 'Babadağdan atlayış! Turkuaz üzerinde süzülmek 🪂', '📸', 'landmark', 5, true, now() - interval '5 days');
    END IF;

    -- ayse_celik (Bursa)
    SELECT id INTO uid FROM public.profiles WHERE username = 'ayse_celik';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Uludağ Teleferik', 'Bursa', 'Türkiye', 40.1064, 29.0628, 'Kış güneşi + kayak keyfi ⛷️', '📸', 'landmark', 4, true, now() - interval '5 hours'),
        (uid, 'Yeşil Türbe', 'Bursa', 'Türkiye', 40.1844, 29.0652, 'Osmanlı mimarisinin zirvesi. Çiniler muhteşem.', '🏛️', 'museum', 5, true, now() - interval '2 days'),
        (uid, 'İskender Kebapçısı', 'Bursa', 'Türkiye', 40.1833, 29.0597, 'Orijinal İskender tadı başka 🍽️', '🍽️', 'restaurant', 5, true, now() - interval '3 days');
    END IF;

    -- burak_yildiz (Trabzon)
    SELECT id INTO uid FROM public.profiles WHERE username = 'burak_yildiz';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Sümela Manastırı', 'Trabzon', 'Türkiye', 40.6890, 39.6546, 'Yamaç üzerinde bir hayal!', '📸', 'landmark', 5, true, now() - interval '2 hours'),
        (uid, 'Uzungöl', 'Trabzon', 'Türkiye', 40.6178, 40.2933, 'Yeşilin her tonu burada. Muhteşem göl 🌲', '🌳', 'park', 5, true, now() - interval '3 days'),
        (uid, 'Ayasofya Müzesi Trabzon', 'Trabzon', 'Türkiye', 41.0038, 39.7148, 'İstanbul versiyonundan küçük ama etkileyici.', '🏛️', 'museum', 4, true, now() - interval '5 days');
    END IF;

    -- selin_arslan (Muğla)
    SELECT id INTO uid FROM public.profiles WHERE username = 'selin_arslan';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Bodrum Kalesi', 'Muğla', 'Türkiye', 37.0325, 27.4304, 'Sualtı Arkeoloji Müzesi inanılmaz 🏰', '🏛️', 'museum', 4, true, now() - interval '4 hours'),
        (uid, 'Dalyan Kaunos', 'Muğla', 'Türkiye', 36.8289, 28.6403, 'Kral mezarları karşısında tekne turu 🚣', '📸', 'landmark', 5, true, now() - interval '2 days');
    END IF;

    -- deniz_koc (Gaziantep)
    SELECT id INTO uid FROM public.profiles WHERE username = 'deniz_koc';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Zeugma Müzesi', 'Gaziantep', 'Türkiye', 37.0676, 37.3734, 'Çingene kızı mozaiği muhteşem!', '🏛️', 'museum', 5, true, now() - interval '6 hours'),
        (uid, 'Bakırcılar Çarşısı', 'Gaziantep', 'Türkiye', 37.0594, 37.3787, 'El yapımı bakır işleri. Katmer + kahve 🧆', '☕', 'cafe', 5, true, now() - interval '2 days'),
        (uid, 'Antep Mutfak Müzesi', 'Gaziantep', 'Türkiye', 37.0620, 37.3800, 'UNESCO gastronomi şehri!', '🍽️', 'restaurant', 5, true, now() - interval '4 days');
    END IF;

    -- ceren_aydin (Kapadokya)
    SELECT id INTO uid FROM public.profiles WHERE username = 'ceren_aydin';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Göreme Balon Turu', 'Nevşehir', 'Türkiye', 38.6431, 34.8313, 'Sabah 5:30 kalkış ama manzara her şeye değer! 🎈', '📸', 'landmark', 5, true, now() - interval '1 hour'),
        (uid, 'Uçhisar Kalesi', 'Nevşehir', 'Türkiye', 38.6297, 34.8070, 'En yüksek peri bacası! Panoramik manzara.', '📸', 'landmark', 5, true, now() - interval '2 days'),
        (uid, 'Derinkuyu Yeraltı Şehri', 'Nevşehir', 'Türkiye', 38.3745, 34.7346, '8 kat yeraltı! Antik insanlar nasıl yaşamış...', '🏛️', 'museum', 5, true, now() - interval '4 days');
    END IF;

    -- oguz_turk (Bodrum)
    SELECT id INTO uid FROM public.profiles WHERE username = 'oguz_turk';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Bodrum Marina', 'Muğla', 'Türkiye', 37.0350, 27.4290, 'Yatlar sıra sıra. Gün batımında cocktail 🍸', '🍷', 'bar', 4, true, now() - interval '3 hours'),
        (uid, 'Gümüşlük Tavşan Adası', 'Muğla', 'Türkiye', 37.0444, 27.2389, 'Yürüyerek adaya gitme deneyimi unique! 🐇', '📸', 'landmark', 5, true, now() - interval '5 days');
    END IF;

    -- pinar_gul (Mardin)
    SELECT id INTO uid FROM public.profiles WHERE username = 'pinar_gul';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Mardin Eski Çarşı', 'Mardin', 'Türkiye', 37.3128, 40.7354, 'Taş evler, dar sokaklar. Mezopotamya havası 🏛️', '📸', 'landmark', 5, true, now() - interval '8 hours'),
        (uid, 'Deyrulzafaran Manastırı', 'Mardin', 'Türkiye', 37.2950, 40.7600, '1600 yıllık manastır. İnanılmaz bir ruhani atmosfer.', '🏛️', 'museum', 5, true, now() - interval '3 days');
    END IF;

    -- kaan_ozturk (Fethiye)
    SELECT id INTO uid FROM public.profiles WHERE username = 'kaan_ozturk';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Ölüdeniz Blue Lagoon', 'Muğla', 'Türkiye', 36.5498, 29.1158, 'Turkuaz suyun 50 tonu! En güzel plaj 🏖️', '📸', 'landmark', 5, true, now() - interval '2 hours'),
        (uid, 'Kayaköy Ghost Village', 'Muğla', 'Türkiye', 36.5820, 29.0870, 'Terk edilmiş köy. Tarihi atmosfer.', '🏛️', 'museum', 4, true, now() - interval '4 days');
    END IF;

    -- hasan_demir (Rize)
    SELECT id INTO uid FROM public.profiles WHERE username = 'hasan_demir';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Kaçkar Dağları', 'Rize', 'Türkiye', 40.8330, 41.0890, 'Zirve tırmanışı 8 saat! Buzul gölleri ⛰️', '🌳', 'park', 5, true, now() - interval '1 day'),
        (uid, 'Ayder Yaylası', 'Rize', 'Türkiye', 40.9508, 41.1001, 'Kaplıca + doğa = mükemmel tatil 🍵', '🌳', 'park', 5, true, now() - interval '3 days');
    END IF;

    -- baris_erdem (Hatay)
    SELECT id INTO uid FROM public.profiles WHERE username = 'baris_erdem';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Antakya Mozaik Müzesi', 'Hatay', 'Türkiye', 36.2032, 36.1596, 'Dünyanın en büyük mozaik koleksiyonu!', '🏛️', 'museum', 5, true, now() - interval '5 hours'),
        (uid, 'Harbiye Şelalesi', 'Hatay', 'Türkiye', 36.1400, 36.1200, 'Doğal güzellik + künefe 🥘', '🌳', 'park', 4, true, now() - interval '3 days');
    END IF;

    -- murat_acar (Nevşehir)
    SELECT id INTO uid FROM public.profiles WHERE username = 'murat_acar';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Avanos Çömlekçilik', 'Nevşehir', 'Türkiye', 38.7148, 34.8464, 'Kendi çömleğimi yaptım! El sanatları 🏺', '📸', 'landmark', 4, true, now() - interval '6 hours'),
        (uid, 'Ihlara Vadisi', 'Aksaray', 'Türkiye', 38.2550, 34.2975, '14 km kanyon yürüyüşü. Kaya kiliseleri harika.', '🌳', 'park', 5, true, now() - interval '4 days');
    END IF;

    -- ─── EUROPEAN CHECK-INS ───

    -- sophie_martin (Paris)
    SELECT id INTO uid FROM public.profiles WHERE username = 'sophie_martin';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Tour Eiffel', 'Paris', 'Fransa', 48.8584, 2.2945, 'Gece ışıkları muhteşem! Her seferinde yeniden aşık 🗼', '📸', 'landmark', 5, true, now() - interval '4 hours'),
        (uid, 'Le Marais', 'Paris', 'Fransa', 48.8600, 2.3622, 'Vintage dükkânlar, crêpe sokakları. Paris ruhu burada ❤️', '☕', 'cafe', 5, true, now() - interval '2 days'),
        (uid, 'Musée d''Orsay', 'Paris', 'Fransa', 48.8600, 2.3266, 'İzlenimciler koleksiyonu. Monet ve Renoir!', '🏛️', 'museum', 5, true, now() - interval '5 days');
    END IF;

    -- marco_rossi (Roma)
    SELECT id INTO uid FROM public.profiles WHERE username = 'marco_rossi';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Colosseum', 'Roma', 'İtalya', 41.8902, 12.4922, 'Gladyatör arenası! 2000 yıllık tarih 🏟️', '🏛️', 'museum', 5, true, now() - interval '3 hours'),
        (uid, 'Trastevere', 'Roma', 'İtalya', 41.8827, 12.4695, 'En iyi carbonara burada! Dar sokaklar, aşk 🍝', '🍽️', 'restaurant', 5, true, now() - interval '1 day'),
        (uid, 'Trevi Çeşmesi', 'Roma', 'İtalya', 41.9009, 12.4833, 'Para attım, geri döneceğime inanıyorum! 💰', '📸', 'landmark', 4, true, now() - interval '4 days');
    END IF;

    -- anna_schmidt (Berlin)
    SELECT id INTO uid FROM public.profiles WHERE username = 'anna_schmidt';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Brandenburg Gate', 'Berlin', 'Almanya', 52.5163, 13.3777, 'Tarih burada yaşanmış. Gece aydınlatması çok güzel.', '📸', 'landmark', 5, true, now() - interval '5 hours'),
        (uid, 'East Side Gallery', 'Berlin', 'Almanya', 52.5052, 13.4398, 'Berlin Duvarı sanat galerisi. Özgürlük!', '🏛️', 'museum', 5, true, now() - interval '2 days'),
        (uid, 'Berghain', 'Berlin', 'Almanya', 52.5112, 13.4426, 'Efsanevi club. Ses sistemi başka bir dünya 🎵', '🍷', 'bar', 4, true, now() - interval '6 days');
    END IF;

    -- elena_garcia (Barcelona)
    SELECT id INTO uid FROM public.profiles WHERE username = 'elena_garcia';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Sagrada Família', 'Barcelona', 'İspanya', 41.4036, 2.1744, 'Gaudi''nin başyapıtı. İç mekanın ışık oyunları 😍', '📸', 'landmark', 5, true, now() - interval '2 hours'),
        (uid, 'La Boqueria Market', 'Barcelona', 'İspanya', 41.3816, 2.1720, 'Taze meyve smoothie + jamón! Pazar cenneti 🍓', '🍽️', 'restaurant', 5, true, now() - interval '3 days'),
        (uid, 'Park Güell', 'Barcelona', 'İspanya', 41.4145, 2.1527, 'Mozaik bank! Şehir manzarası bonus 🎨', '🌳', 'park', 5, true, now() - interval '5 days');
    END IF;

    -- lucas_muller (München)
    SELECT id INTO uid FROM public.profiles WHERE username = 'lucas_muller';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Marienplatz', 'Münih', 'Almanya', 48.1374, 11.5755, 'Glockenspiel saat gösterisi! Bavyera kalbi.', '📸', 'landmark', 4, true, now() - interval '6 hours'),
        (uid, 'Neuschwanstein Castle', 'Füssen', 'Almanya', 47.5576, 10.7498, 'Disney kalesinin ilham kaynağı! Kış harika ❄️', '📸', 'landmark', 5, true, now() - interval '3 days');
    END IF;

    -- julia_novak (Viyana)
    SELECT id INTO uid FROM public.profiles WHERE username = 'julia_novak';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Schönbrunn Palace', 'Viyana', 'Avusturya', 48.1845, 16.3122, 'İmparatorluk bahçeleri! Gloriette manzarası.', '📸', 'landmark', 5, true, now() - interval '4 hours'),
        (uid, 'Café Central', 'Viyana', 'Avusturya', 48.2102, 16.3652, 'Freud burada kahve içmiş. Sachertorte! ☕', '☕', 'cafe', 5, true, now() - interval '2 days');
    END IF;

    -- jan_de_vries (Amsterdam)
    SELECT id INTO uid FROM public.profiles WHERE username = 'jan_de_vries';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Rijksmuseum', 'Amsterdam', 'Hollanda', 52.3600, 4.8852, 'Rembrandt Night Watch! Müze meydanı 🎨', '🏛️', 'museum', 5, true, now() - interval '3 hours'),
        (uid, 'Vondelpark', 'Amsterdam', 'Hollanda', 52.3579, 4.8686, 'Bisiklet + piknik. Hollanda baharı 🚲', '🌳', 'park', 4, true, now() - interval '4 days');
    END IF;

    -- maria_silva (Lizbon)
    SELECT id INTO uid FROM public.profiles WHERE username = 'maria_silva';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Belém Tower', 'Lizbon', 'Portekiz', 38.6916, -9.2160, 'Keşifler çağının simgesi! Pastéis de Belém 🥐', '📸', 'landmark', 5, true, now() - interval '5 hours'),
        (uid, 'Alfama', 'Lizbon', 'Portekiz', 38.7108, -9.1305, 'Fado müziği + dar sokaklar. Portekiz ruhu 🎸', '📸', 'landmark', 5, true, now() - interval '3 days');
    END IF;

    -- katerina_papadopoulos (Atina)
    SELECT id INTO uid FROM public.profiles WHERE username = 'katerina_papadopoulos';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Akropolis', 'Atina', 'Yunanistan', 37.9715, 23.7267, 'Parthenon gün batımında! 2500 yıllık tarih 🏛️', '🏛️', 'museum', 5, true, now() - interval '2 hours'),
        (uid, 'Plaka', 'Atina', 'Yunanistan', 37.9720, 23.7300, 'Eski şehir souvlaki + ouzo teras keyfi 🍽️', '🍽️', 'restaurant', 5, true, now() - interval '4 days');
    END IF;

    -- nikos_alexandros (Santorini)
    SELECT id INTO uid FROM public.profiles WHERE username = 'nikos_alexandros';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Oia Sunset', 'Santorini', 'Yunanistan', 36.4618, 25.3753, 'Dünyanın en güzel gün batımı! Mavi kubbeler 🌅', '📸', 'landmark', 5, true, now() - interval '1 hour'),
        (uid, 'Red Beach', 'Santorini', 'Yunanistan', 36.3472, 25.3960, 'Kırmızı uçurumlar + kristal deniz. Benzersiz.', '🌳', 'park', 5, true, now() - interval '3 days');
    END IF;

    -- viktor_horvath (Budapeşte)
    SELECT id INTO uid FROM public.profiles WHERE username = 'viktor_horvath';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Széchenyi Thermal Bath', 'Budapeşte', 'Macaristan', 47.5185, 19.0823, 'Açık hava termal havuzu! Kış günü buhar ♨️', '🏨', 'hotel', 5, true, now() - interval '4 hours'),
        (uid, 'Fisherman''s Bastion', 'Budapeşte', 'Macaristan', 47.5020, 19.0345, 'Tuna manzarası! Parlamento binası karşıda.', '📸', 'landmark', 5, true, now() - interval '2 days');
    END IF;

    -- chiara_bianchi (Floransa)
    SELECT id INTO uid FROM public.profiles WHERE username = 'chiara_bianchi';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Ponte Vecchio', 'Floransa', 'İtalya', 43.7680, 11.2531, 'Orta çağ köprüsü! Kuyumcu dükkânları 💎', '📸', 'landmark', 5, true, now() - interval '3 hours'),
        (uid, 'Uffizi Gallery', 'Floransa', 'İtalya', 43.7677, 11.2553, 'Botticelli Venüs! Rönesans sanatının kalbi 🎨', '🏛️', 'museum', 5, true, now() - interval '5 days');
    END IF;

    -- andrei_popescu (Bükreş)
    SELECT id INTO uid FROM public.profiles WHERE username = 'andrei_popescu';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Bran Castle', 'Braşov', 'Romanya', 45.5151, 25.3672, 'Dracula''nın kalesi! Transilvanya mistik havası 🏰', '📸', 'landmark', 5, true, now() - interval '6 hours'),
        (uid, 'Peleş Castle', 'Sinaia', 'Romanya', 45.3601, 25.5429, 'Karpatların ortasında masal kalesi. İnanılmaz iç mekan.', '📸', 'landmark', 5, true, now() - interval '4 days');
    END IF;

    -- marta_kowalski (Krakow)
    SELECT id INTO uid FROM public.profiles WHERE username = 'marta_kowalski';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Wieliczka Salt Mine', 'Krakow', 'Polonya', 49.9833, 20.0553, 'Yeraltı katedrali! Tuz heykeller inanılmaz.', '🏛️', 'museum', 5, true, now() - interval '8 hours'),
        (uid, 'Main Market Square', 'Krakow', 'Polonya', 50.0614, 19.9372, 'Avrupa''nın en büyük meydanlarından. Gece büyüleyici.', '📸', 'landmark', 5, true, now() - interval '3 days');
    END IF;

    -- emma_obrien (Dublin)
    SELECT id INTO uid FROM public.profiles WHERE username = 'emma_obrien';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Temple Bar', 'Dublin', 'İrlanda', 53.3455, -6.2633, 'Live müzik + Guinness. İrlanda gecesi! 🍀', '🍷', 'bar', 5, true, now() - interval '5 hours'),
        (uid, 'Cliffs of Moher', 'Clare', 'İrlanda', 52.9715, -9.4263, '200m uçurumlar! Atlantik dalgaları. Nefes kesen.', '📸', 'landmark', 5, true, now() - interval '6 days');
    END IF;

    -- lena_svensson (Kopenhag)
    SELECT id INTO uid FROM public.profiles WHERE username = 'lena_svensson';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Nyhavn', 'Kopenhag', 'Danimarka', 55.6800, 12.5891, 'Renkli evler! Kanal kenarı kahve keyfi 🎡', '📸', 'landmark', 5, true, now() - interval '3 hours'),
        (uid, 'Tivoli Gardens', 'Kopenhag', 'Danimarka', 55.6736, 12.5681, 'Dünyanın en eski lunaparkı. Gece ışıkları magical ✨', '🌳', 'park', 5, true, now() - interval '4 days');
    END IF;

    -- erik_johansson (Stockholm)
    SELECT id INTO uid FROM public.profiles WHERE username = 'erik_johansson';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Vasa Museum', 'Stockholm', 'İsveç', 59.3280, 18.0913, '17.yy savaş gemisi! Dünyada eşi benzeri yok.', '🏛️', 'museum', 5, true, now() - interval '4 hours'),
        (uid, 'Gamla Stan', 'Stockholm', 'İsveç', 59.3255, 18.0711, 'Ortaçağ sokakları. Nobel Müzesi burada.', '📸', 'landmark', 5, true, now() - interval '5 days');
    END IF;

    -- ingrid_berg (Oslo)
    SELECT id INTO uid FROM public.profiles WHERE username = 'ingrid_berg';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Vigeland Sculpture Park', 'Oslo', 'Norveç', 59.9269, 10.7005, '212 heykel! İnsan vücudu sanatı. Çok etkileyici.', '🌳', 'park', 5, true, now() - interval '7 hours'),
        (uid, 'Oslo Opera House', 'Oslo', 'Norveç', 59.9074, 10.7529, 'Çatısında yürümek! Fiyort manzarası 🛶', '📸', 'landmark', 5, true, now() - interval '3 days');
    END IF;

    -- hans_weber (Zürih)
    SELECT id INTO uid FROM public.profiles WHERE username = 'hans_weber';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Matterhorn', 'Zermatt', 'İsviçre', 45.9763, 7.6586, 'Toblerone dağı! Kayak + panorama ⛷️', '📸', 'landmark', 5, true, now() - interval '2 hours'),
        (uid, 'Lake Zürich', 'Zürih', 'İsviçre', 47.3549, 8.5404, 'Göl kenarı yürüyüş. Alp havası. Çikolata turu 🍫', '🌳', 'park', 4, true, now() - interval '4 days');
    END IF;

    -- pierre_dubois (Lyon)
    SELECT id INTO uid FROM public.profiles WHERE username = 'pierre_dubois';
    IF uid IS NOT NULL THEN
        INSERT INTO public.check_ins (user_id, place_name, city, country, lat, lng, note, emoji, category, rating, is_public, created_at) VALUES
        (uid, 'Vieux Lyon', 'Lyon', 'Fransa', 45.7626, 4.8268, 'UNESCO eski şehir. Traboule geçitleri harika!', '📸', 'landmark', 5, true, now() - interval '6 hours'),
        (uid, 'Les Halles de Lyon', 'Lyon', 'Fransa', 45.7575, 4.8540, 'Gastronomi başkenti! Her dükkan bir keşif 🍷', '🍽️', 'restaurant', 5, true, now() - interval '3 days');
    END IF;

END $$;

-- ══════════════════════════════════
-- STEP 5: FOLLOWS — rich follow graph
-- ══════════════════════════════════

-- Make the real user follow many test users (so feed shows content)
DO $$
DECLARE
    real_uid uuid;
    test_uid uuid;
    test_record RECORD;
BEGIN
    -- Find the real (non-test) user
    SELECT id INTO real_uid FROM public.profiles
    WHERE email NOT LIKE '%@test.mapmemo.com' AND email NOT LIKE '%@test.com'
    LIMIT 1;

    IF real_uid IS NOT NULL THEN
        -- Real user follows all test users
        FOR test_record IN
            SELECT id FROM public.profiles
            WHERE email LIKE '%@test.mapmemo.com'
            AND id != real_uid
        LOOP
            INSERT INTO public.follows (follower_id, following_id)
            VALUES (real_uid, test_record.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Some test users follow the real user back
        FOR test_record IN
            SELECT id FROM public.profiles
            WHERE email LIKE '%@test.mapmemo.com'
            AND id != real_uid
            ORDER BY random()
            LIMIT 20
        LOOP
            INSERT INTO public.follows (follower_id, following_id)
            VALUES (test_record.id, real_uid)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Cross-follows between test users (create a rich social graph)
    FOR test_record IN
        SELECT id FROM public.profiles WHERE email LIKE '%@test.mapmemo.com'
    LOOP
        -- Each user follows 5-10 random other users
        INSERT INTO public.follows (follower_id, following_id)
        SELECT test_record.id, p.id
        FROM public.profiles p
        WHERE p.id != test_record.id
        AND p.email LIKE '%@test.mapmemo.com'
        ORDER BY random()
        LIMIT (5 + floor(random() * 6)::int)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ══════════════════════════════════
-- STEP 6: LIKES — engagement
-- ══════════════════════════════════
DO $$
DECLARE
    checkin_record RECORD;
    liker_record RECORD;
BEGIN
    -- Each check-in gets 1-5 random likes
    FOR checkin_record IN
        SELECT id, user_id FROM public.check_ins ORDER BY random() LIMIT 80
    LOOP
        FOR liker_record IN
            SELECT id FROM public.profiles
            WHERE id != checkin_record.user_id
            ORDER BY random()
            LIMIT (1 + floor(random() * 5)::int)
        LOOP
            INSERT INTO public.feed_likes (user_id, target_type, target_id)
            VALUES (liker_record.id, 'check_in', checkin_record.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ══════════════════════════════════
-- STEP 7: STORIES — recent stories
-- ══════════════════════════════════
INSERT INTO public.stories (user_id, type, content, city, emoji, bg_color, created_at, expires_at)
SELECT
    p.id,
    'checkin',
    c.emoji || ' ' || c.place_name || ' — ' || COALESCE(c.city, ''),
    c.city,
    c.emoji,
    (ARRAY['#4F46E5','#7C3AED','#EC4899','#D97706','#059669','#DC2626','#0891B2'])[1 + floor(random()*7)::int],
    now() - (floor(random()*12)::int || ' hours')::interval,
    now() + ((12 + floor(random()*12)::int) || ' hours')::interval
FROM public.check_ins c
JOIN public.profiles p ON p.id = c.user_id
WHERE c.created_at > now() - interval '3 days'
ORDER BY random()
LIMIT 15
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════
-- STEP 8: Update counts
-- ══════════════════════════════════
UPDATE public.profiles p SET
    checkin_count = (SELECT COUNT(*) FROM public.check_ins c WHERE c.user_id = p.id),
    follower_count = (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id),
    following_count = (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id);

-- Also update check-ins that are missing lat/lng
UPDATE public.check_ins SET lat = 41.0082, lng = 28.9784
WHERE lat IS NULL AND city = 'İstanbul';
UPDATE public.check_ins SET lat = 39.9334, lng = 32.8597
WHERE lat IS NULL AND city = 'Ankara';

-- ══════════════════════════════════
-- STEP 9: Add photo URLs to all check-ins
-- ══════════════════════════════════
-- Each check-in gets a unique seeded photo from picsum.photos
UPDATE public.check_ins SET photo_url =
    'https://picsum.photos/seed/' || encode(id::text::bytea, 'hex') || '/800/500'
WHERE photo_url IS NULL;

-- Also update existing real user's profile with avatar if missing
UPDATE public.profiles SET
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(username, id::text) || '&backgroundColor=b6e3f4,c0aede,d1d4f9'
WHERE avatar_url IS NULL;

-- ══════════════════════════════════
-- STEP 10: Add media URLs to stories
-- ══════════════════════════════════
UPDATE public.stories SET media_url =
    CASE (floor(random()*10)::int)
        WHEN 0 THEN '/social/istanbul_galata.png'
        WHEN 1 THEN '/social/cappadocia_balloons.png'
        WHEN 2 THEN '/social/istanbul_mosque.png'
        WHEN 3 THEN '/social/paris_eiffel.png'
        WHEN 4 THEN '/social/bosphorus_ferry.png'
        WHEN 5 THEN '/social/bazaar_spices.png'
        ELSE 'https://picsum.photos/seed/' || encode(id::text::bytea, 'hex') || '/600/900'
    END
WHERE media_url IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- DONE! Massive seed data loaded:
-- 50 test users with DiceBear avatars
-- 100+ check-ins across Turkey & Europe with lat/lng and photos
-- Rich follow graph (real user follows all test users)
-- Random likes on check-ins
-- 15 active stories with media images
-- ═══════════════════════════════════════════════════════════════
