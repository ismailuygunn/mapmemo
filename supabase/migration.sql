-- ============================================
-- MapMemo — Supabase Database Migration
-- ============================================
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 2. SPACES (Couple Spaces)
-- ==========================================
create table if not exists public.spaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  invite_token text unique not null,
  created_at timestamptz default now()
);

-- ==========================================
-- 3. SPACE MEMBERS
-- ==========================================
create table if not exists public.space_members (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(space_id, user_id)
);

-- ==========================================
-- 4. PINS
-- ==========================================
create table if not exists public.pins (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces on delete cascade not null,
  created_by uuid references auth.users,
  title text not null,
  type text default 'memory' check (type in ('food','view','activity','hotel','memory','photospot','transport','warning')),
  status text default 'visited' check (status in ('visited','planned','wishlist')),
  lat double precision not null,
  lng double precision not null,
  city text,
  country text,
  notes text,
  tags text[] default '{}',
  rating integer default 0 check (rating >= 0 and rating <= 5),
  date_visited date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==========================================
-- 5. PIN MEDIA
-- ==========================================
create table if not exists public.pin_media (
  id uuid default uuid_generate_v4() primary key,
  pin_id uuid references public.pins on delete cascade not null,
  url text not null,
  type text default 'image' check (type in ('image', 'video')),
  caption text,
  created_at timestamptz default now()
);

-- ==========================================
-- 6. TRIPS
-- ==========================================
create table if not exists public.trips (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces on delete cascade not null,
  city text not null,
  start_date date,
  end_date date,
  tempo text,
  budget text,
  itinerary_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.pins enable row level security;
alter table public.pin_media enable row level security;
alter table public.trips enable row level security;

-- PROFILES: users can read all profiles, update own
create policy "Profiles: anyone can read"
  on public.profiles for select
  using (true);

create policy "Profiles: users can update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles: users can insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- SPACES: members can read their spaces
create policy "Spaces: members can read"
  on public.spaces for select
  using (
    id in (select space_id from public.space_members where user_id = auth.uid())
    or invite_token is not null  -- allow reading to check invite token
  );

create policy "Spaces: authenticated users can create"
  on public.spaces for insert
  with check (auth.uid() = created_by);

create policy "Spaces: owner can update"
  on public.spaces for update
  using (created_by = auth.uid());

-- SPACE MEMBERS: members can read, insert for themselves
create policy "Space Members: members can read"
  on public.space_members for select
  using (
    space_id in (select space_id from public.space_members where user_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Space Members: users can insert themselves"
  on public.space_members for insert
  with check (user_id = auth.uid());

-- PINS: space members can CRUD
create policy "Pins: space members can read"
  on public.pins for select
  using (space_id in (select space_id from public.space_members where user_id = auth.uid()));

create policy "Pins: space members can create"
  on public.pins for insert
  with check (space_id in (select space_id from public.space_members where user_id = auth.uid()));

create policy "Pins: space members can update"
  on public.pins for update
  using (space_id in (select space_id from public.space_members where user_id = auth.uid()));

create policy "Pins: space members can delete"
  on public.pins for delete
  using (space_id in (select space_id from public.space_members where user_id = auth.uid()));

-- PIN MEDIA: same as pins
create policy "Pin Media: space members can read"
  on public.pin_media for select
  using (pin_id in (select id from public.pins where space_id in (select space_id from public.space_members where user_id = auth.uid())));

create policy "Pin Media: space members can create"
  on public.pin_media for insert
  with check (pin_id in (select id from public.pins where space_id in (select space_id from public.space_members where user_id = auth.uid())));

create policy "Pin Media: space members can delete"
  on public.pin_media for delete
  using (pin_id in (select id from public.pins where space_id in (select space_id from public.space_members where user_id = auth.uid())));

-- TRIPS: space members can CRUD
create policy "Trips: space members can read"
  on public.trips for select
  using (space_id in (select space_id from public.space_members where user_id = auth.uid()));

create policy "Trips: space members can create"
  on public.trips for insert
  with check (space_id in (select space_id from public.space_members where user_id = auth.uid()));

create policy "Trips: space members can update"
  on public.trips for update
  using (space_id in (select space_id from public.space_members where user_id = auth.uid()));

create policy "Trips: space members can delete"
  on public.trips for delete
  using (space_id in (select space_id from public.space_members where user_id = auth.uid()));

-- ==========================================
-- 8. STORAGE BUCKET
-- ==========================================
-- Create storage bucket for pin media
insert into storage.buckets (id, name, public) 
values ('pin-media', 'pin-media', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Pin Media Storage: users can upload"
  on storage.objects for insert
  with check (bucket_id = 'pin-media' and auth.role() = 'authenticated');

create policy "Pin Media Storage: public read"
  on storage.objects for select
  using (bucket_id = 'pin-media');

create policy "Pin Media Storage: users can delete own"
  on storage.objects for delete
  using (bucket_id = 'pin-media' and auth.role() = 'authenticated');

-- ==========================================
-- DONE! Your database is ready.
-- ==========================================
