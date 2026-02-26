-- ============================================
-- FIX: Infinite recursion in space_members policy
-- ============================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Drop the old recursive policy
drop policy if exists "Space Members: members can read" on public.space_members;

-- Create a new, non-recursive policy
-- Users can simply read their own memberships
create policy "Space Members: members can read"
  on public.space_members for select
  using (user_id = auth.uid());
