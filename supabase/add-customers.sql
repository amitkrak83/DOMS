-- ============================================================
-- Run this in Supabase SQL Editor
-- Adds customers table and links orders to customers
-- ============================================================

-- Customers master table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Link orders to customers (nullable so existing orders still work)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON customers;
CREATE POLICY "authenticated_all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
