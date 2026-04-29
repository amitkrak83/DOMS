-- ============================================================
-- ADMIN SCHEMA — run this in Supabase SQL editor
-- ============================================================

-- 1. Allowed emails (whitelist — controls who can sign in)
CREATE TABLE IF NOT EXISTS allowed_emails (
  email      TEXT PRIMARY KEY,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by   TEXT
);

-- Seed the super-admin and any existing users
INSERT INTO allowed_emails (email) VALUES
  ('amitkr.ak83@gmail.com')
ON CONFLICT DO NOTHING;

-- 2. Profiles (one row per user who has signed in)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. App settings (key-value store for runtime config)
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('upi_id',        '9918802425@okbizicici'),
  ('merchant_name', 'Verma Rice Mill')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Helper: is_admin() — SECURITY DEFINER bypasses RLS so it
-- can read profiles without circular-dependency issues.
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    auth.email() = 'amitkr.ak83@gmail.com'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
$$;

-- ============================================================
-- Grants (must come before RLS policies)
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

GRANT SELECT ON allowed_emails TO authenticated, anon;
GRANT INSERT, DELETE ON allowed_emails TO authenticated;

GRANT SELECT, UPDATE ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;

-- ============================================================
-- RLS
-- ============================================================

-- allowed_emails: readable by everyone (login page check),
--   writable only by admins.
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allowed_emails_select" ON allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_insert" ON allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_delete" ON allowed_emails;

CREATE POLICY "allowed_emails_select" ON allowed_emails
  FOR SELECT USING (true);

CREATE POLICY "allowed_emails_insert" ON allowed_emails
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "allowed_emails_delete" ON allowed_emails
  FOR DELETE USING (is_admin());

-- profiles: users see their own row; admins see all rows.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (is_admin());

-- app_settings: any authenticated user can read;
--   only admins can update.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON app_settings;
DROP POLICY IF EXISTS "settings_update" ON app_settings;

CREATE POLICY "settings_select" ON app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "settings_update" ON app_settings
  FOR UPDATE USING (is_admin());
