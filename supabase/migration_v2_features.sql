-- MapMemo v2 — New Tables for Chat, Expenses, Itinerary
-- Run this in Supabase SQL Editor AFTER migration_complete.sql

-- ═══════════════════════════════════════════════════════════
-- 1. TRIP MESSAGES (Chat)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS trip_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- text, location, pin
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_messages_trip ON trip_messages(trip_id, created_at);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_messages_access" ON trip_messages
    USING (space_id IN (SELECT get_my_space_ids()));

CREATE POLICY "trip_messages_insert" ON trip_messages
    FOR INSERT WITH CHECK (space_id IN (SELECT get_my_space_ids()));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE trip_messages;

-- ═══════════════════════════════════════════════════════════
-- 2. TRIP EXPENSES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    category TEXT DEFAULT 'other', -- food, transport, hotel, activity, shopping, other
    split_type TEXT DEFAULT 'equal', -- equal, custom
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip ON trip_expenses(trip_id);

ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_expenses_access" ON trip_expenses
    USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "trip_expenses_insert" ON trip_expenses
    FOR INSERT WITH CHECK (space_id IN (SELECT get_my_space_ids()));

-- ═══════════════════════════════════════════════════════════
-- 3. EXPENSE SHARES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expense_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES trip_expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_settled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_shares_access" ON expense_shares
    USING (user_id = auth.uid() OR expense_id IN (
        SELECT id FROM trip_expenses WHERE space_id IN (SELECT get_my_space_ids())
    ));
CREATE POLICY "expense_shares_insert" ON expense_shares
    FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 4. ITINERARY ITEMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL DEFAULT 0,
    time_slot TEXT, -- '09:00', '14:00', etc.
    title TEXT NOT NULL,
    category TEXT DEFAULT 'attraction', -- attraction, restaurant, transport, hotel, activity, free
    spot_id UUID,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON itinerary_items(trip_id, day_index);

ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itinerary_items_access" ON itinerary_items
    USING (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "itinerary_items_insert" ON itinerary_items
    FOR INSERT WITH CHECK (space_id IN (SELECT get_my_space_ids()));
CREATE POLICY "itinerary_items_delete" ON itinerary_items
    FOR DELETE USING (space_id IN (SELECT get_my_space_ids()));
