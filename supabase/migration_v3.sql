-- ============================================
-- MapMemo — Phase 4 Migration: Price Alerts
-- ============================================
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

create table if not exists public.price_alerts (
    id uuid default uuid_generate_v4() primary key,
    space_id uuid references public.spaces on delete cascade not null,
    created_by uuid references auth.users not null,
    origin_code text not null,         -- IATA code: IST
    destination_code text not null,    -- IATA code: CDG
    departure_date date not null,
    return_date date,
    target_price numeric,              -- alert when price drops below this
    currency text default 'TRY',
    last_price numeric,                -- last checked price
    last_checked timestamptz,
    is_active boolean default true,
    is_triggered boolean default false,
    created_at timestamptz default now()
);

alter table public.price_alerts enable row level security;

create policy "Price Alerts: space members can read"
    on public.price_alerts for select
    using (
        space_id in (select space_id from public.space_members where user_id = auth.uid())
    );

create policy "Price Alerts: members can create"
    on public.price_alerts for insert
    with check (
        space_id in (select space_id from public.space_members where user_id = auth.uid())
    );

create policy "Price Alerts: creator can update"
    on public.price_alerts for update
    using (created_by = auth.uid());

create policy "Price Alerts: creator can delete"
    on public.price_alerts for delete
    using (created_by = auth.uid());

-- ==========================================
-- DONE! Phase 4 table ready.
-- ==========================================
