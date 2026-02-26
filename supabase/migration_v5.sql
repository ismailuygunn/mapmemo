-- ═══════════════════════════════════════════
-- Migration V5: Group Spaces + Roles + Meetups
-- ═══════════════════════════════════════════
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- ==========================================
-- 1. EXPAND ROLES ON SPACE_MEMBERS
-- ==========================================
-- Update role constraint to support 4 roles
ALTER TABLE public.space_members DROP CONSTRAINT IF EXISTS space_members_role_check;
ALTER TABLE public.space_members ADD CONSTRAINT space_members_role_check
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

-- Update existing 'member' roles to 'editor' 
UPDATE public.space_members SET role = 'editor' WHERE role = 'member';

-- ==========================================
-- 2. MEETUPS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  city text,
  lat double precision,
  lng double precision,
  location_name text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  external_link text,
  cover_url text,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetups_space ON public.meetups(space_id);
CREATE INDEX IF NOT EXISTS idx_meetups_start ON public.meetups(start_time);

-- ==========================================
-- 3. MEETUP RSVPS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetup_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('going', 'maybe', 'late', 'not_going')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(meetup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_meetup ON public.meetup_rsvps(meetup_id);

-- ==========================================
-- 4. MEETUP TIMELINE (plan steps)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetup_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  time text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_meetup ON public.meetup_timeline(meetup_id);

-- ==========================================
-- 5. MEETUP UPDATES (activity feed)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetup_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('created', 'location_changed', 'time_changed', 'description_changed', 'cancelled', 'rsvp', 'timeline_updated')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_updates_meetup ON public.meetup_updates(meetup_id);

-- ==========================================
-- 6. RLS POLICIES
-- ==========================================
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_updates ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is space member
-- (uses direct auth.uid() comparison to avoid recursion)

-- MEETUPS: space members can read
CREATE POLICY "Meetups: space members can read"
  ON public.meetups FOR SELECT
  USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()));

-- MEETUPS: owner/admin/editor can create
CREATE POLICY "Meetups: editors+ can create"
  ON public.meetups FOR INSERT
  WITH CHECK (
    space_id IN (
      SELECT space_id FROM public.space_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- MEETUPS: owner/admin/editor can update
CREATE POLICY "Meetups: editors+ can update"
  ON public.meetups FOR UPDATE
  USING (
    space_id IN (
      SELECT space_id FROM public.space_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- MEETUPS: owner/admin can delete
CREATE POLICY "Meetups: admins+ can delete"
  ON public.meetups FOR DELETE
  USING (
    space_id IN (
      SELECT space_id FROM public.space_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RSVPS: space members can read all RSVPs for their meetups
CREATE POLICY "RSVPs: space members can read"
  ON public.meetup_rsvps FOR SELECT
  USING (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
    )
  );

-- RSVPS: any space member can RSVP (insert/update their own)
CREATE POLICY "RSVPs: members can insert own"
  ON public.meetup_rsvps FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "RSVPs: members can update own"
  ON public.meetup_rsvps FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "RSVPs: members can delete own"
  ON public.meetup_rsvps FOR DELETE
  USING (user_id = auth.uid());

-- TIMELINE: space members can read
CREATE POLICY "Timeline: space members can read"
  ON public.meetup_timeline FOR SELECT
  USING (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
    )
  );

-- TIMELINE: editors+ can manage
CREATE POLICY "Timeline: editors+ can create"
  ON public.meetup_timeline FOR INSERT
  WITH CHECK (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (
        SELECT space_id FROM public.space_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Timeline: editors+ can update"
  ON public.meetup_timeline FOR UPDATE
  USING (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (
        SELECT space_id FROM public.space_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Timeline: editors+ can delete"
  ON public.meetup_timeline FOR DELETE
  USING (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (
        SELECT space_id FROM public.space_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- UPDATES: space members can read
CREATE POLICY "Updates: space members can read"
  ON public.meetup_updates FOR SELECT
  USING (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
    )
  );

-- UPDATES: any space member can insert (system/user generated)
CREATE POLICY "Updates: members can insert"
  ON public.meetup_updates FOR INSERT
  WITH CHECK (
    meetup_id IN (
      SELECT id FROM public.meetups
      WHERE space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
    )
  );

-- ==========================================
-- 7. UPDATE space_members RLS to allow reading co-members
-- ==========================================
-- Allow users to read ALL members of spaces they belong to (not just their own row)
DROP POLICY IF EXISTS "Space Members: members can read" ON public.space_members;
CREATE POLICY "Space Members: members can read co-members"
  ON public.space_members FOR SELECT
  USING (
    space_id IN (SELECT sm.space_id FROM public.space_members sm WHERE sm.user_id = auth.uid())
  );

-- Allow owner/admin to update member roles
CREATE POLICY "Space Members: owner/admin can update roles"
  ON public.space_members FOR UPDATE
  USING (
    space_id IN (
      SELECT sm.space_id FROM public.space_members sm
      WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
    )
  );

-- Allow owner/admin to remove members
CREATE POLICY "Space Members: owner/admin can delete"
  ON public.space_members FOR DELETE
  USING (
    space_id IN (
      SELECT sm.space_id FROM public.space_members sm
      WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
    )
    AND user_id != auth.uid() -- can't remove yourself
  );

-- ==========================================
-- DONE! Group Spaces + Meetups ready.
-- ==========================================
