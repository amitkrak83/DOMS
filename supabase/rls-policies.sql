-- Run this in Supabase SQL Editor after adding users via Authentication > Users

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive anon policies
DROP POLICY IF EXISTS "allow all" ON orders;
DROP POLICY IF EXISTS "allow all" ON order_items;
DROP POLICY IF EXISTS "allow all" ON payments;
DROP POLICY IF EXISTS "allow all" ON products;
DROP POLICY IF EXISTS "allow all" ON product_variants;

-- Allow only authenticated users (your 3 users)
CREATE POLICY "authenticated_all" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
