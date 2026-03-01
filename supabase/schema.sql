-- ════════════════════════════════════════════════════════════════
-- Seafood Sam's Inventory — Supabase Database Schema
-- ════════════════════════════════════════════════════════════════
--
-- Run this entire file in Supabase Dashboard → SQL Editor → New Query
-- Then click "Run" to create all tables and seed data.
--

-- ──────────────────────────────────────
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ──────────────────────────────────────
-- Links to auth.users and stores display name + role
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Staff',
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ──────────────────────────────────────
-- 2. ITEMS TABLE (main inventory)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id            SERIAL PRIMARY KEY,
  item_number   TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Food',
  location      TEXT NOT NULL DEFAULT 'Cellar',
  quantity       NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_unit  TEXT NOT NULL DEFAULT 'CS',
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_unit     TEXT NOT NULL DEFAULT 'CS',
  total_value    NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_counted   DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
CREATE INDEX IF NOT EXISTS idx_items_name     ON items(name);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────
-- 3. LOCATION SORT ORDERS TABLE
-- ──────────────────────────────────────
-- Stores custom walkthrough counting order per location
CREATE TABLE IF NOT EXISTS location_sort_orders (
  location_name TEXT PRIMARY KEY,
  item_order    INTEGER[] NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS location_sort_orders_updated_at ON location_sort_orders;
CREATE TRIGGER location_sort_orders_updated_at
  BEFORE UPDATE ON location_sort_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_sort_orders ENABLE ROW LEVEL SECURITY;

-- Policies: any authenticated user can read/write inventory
-- (all staff share the same inventory data)
CREATE POLICY "Authenticated users can read items"
  ON items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert items"
  ON items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
  ON items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete items"
  ON items FOR DELETE TO authenticated USING (true);

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Sort orders: shared across all authenticated users
CREATE POLICY "Authenticated users can manage sort orders"
  ON location_sort_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────
-- 5. ENABLE REALTIME
-- ──────────────────────────────────────
-- This lets multiple devices see changes instantly
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE location_sort_orders;


-- ════════════════════════════════════════
-- DONE! Schema is ready.
--
-- Next steps:
--   1. Create user accounts in Authentication tab
--   2. Run the seed script (supabase/seed.sql) to import inventory data
-- ════════════════════════════════════════
