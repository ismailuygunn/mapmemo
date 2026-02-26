-- ============================================
-- MapMemo — Phase 2 Migration: Couple Features
-- ============================================
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- ==========================================
-- 1. TRIP VOTES (Oylama Sistemi)
-- ==========================================
create table if not exists public.trip_votes (
    id uuid default uuid_generate_v4() primary key,
    trip_id uuid references public.trips on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    item_key text not null,
    vote text check (vote in ('up', 'down', 'neutral')),
    created_at timestamptz default now(),
    unique(trip_id, user_id, item_key)
);

alter table public.trip_votes enable row level security;

-- RLS: space members can read votes for their trips
create policy "Trip Votes: members can read"
    on public.trip_votes for select
    using (
        trip_id in (
            select t.id from public.trips t
            where t.space_id in (
                select space_id from public.space_members where user_id = auth.uid()
            )
        )
    );

create policy "Trip Votes: members can insert"
    on public.trip_votes for insert
    with check (user_id = auth.uid());

create policy "Trip Votes: members can update own"
    on public.trip_votes for update
    using (user_id = auth.uid());

create policy "Trip Votes: members can delete own"
    on public.trip_votes for delete
    using (user_id = auth.uid());

-- ==========================================
-- 2. MEMORY CAPSULES (Anı Kapsülü)
-- ==========================================
create table if not exists public.memory_capsules (
    id uuid default uuid_generate_v4() primary key,
    space_id uuid references public.spaces on delete cascade not null,
    created_by uuid references auth.users not null,
    title text not null,
    message text,
    media_urls text[] default '{}',
    reveal_date date not null,
    is_revealed boolean default false,
    revealed_at timestamptz,
    created_at timestamptz default now()
);

alter table public.memory_capsules enable row level security;

-- RLS: space members can CRUD their capsules
create policy "Capsules: space members can read"
    on public.memory_capsules for select
    using (
        space_id in (select space_id from public.space_members where user_id = auth.uid())
    );

create policy "Capsules: space members can create"
    on public.memory_capsules for insert
    with check (
        space_id in (select space_id from public.space_members where user_id = auth.uid())
    );

create policy "Capsules: creator can update"
    on public.memory_capsules for update
    using (created_by = auth.uid());

create policy "Capsules: creator can delete"
    on public.memory_capsules for delete
    using (created_by = auth.uid());

-- ==========================================
-- 3. ADD surprise_config TO TRIPS
-- ==========================================
alter table public.trips add column if not exists surprise_config jsonb;

-- ==========================================
-- DONE! Phase 2 tables are ready.
-- ==========================================
