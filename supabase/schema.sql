-- ============================================================
-- DOMS - Distributor Order Management System
-- Run this in Supabase SQL Editor
-- ============================================================

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Product Variants (scheme embedded here)
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_name text not null,
  bottles_per_case integer not null default 24,
  price_per_case numeric(10,2) not null,
  free_bottles_per_case integer not null default 0,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  status text not null default 'pending' check (status in ('pending', 'delivered')),
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  cases integer not null,
  free_bottles integer not null default 0,
  total_bottles integer not null,
  amount numeric(10,2) not null,
  price_per_case_snapshot numeric(10,2) not null
);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  payment_type text not null check (payment_type in ('cash', 'credit')),
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Enable Realtime on orders table
alter publication supabase_realtime add table orders;

-- ============================================================
-- DUMMY SEED DATA
-- ============================================================

-- Products
insert into products (id, name) values
  ('11111111-0000-0000-0000-000000000001', 'Sprite'),
  ('11111111-0000-0000-0000-000000000002', 'Coca Cola'),
  ('11111111-0000-0000-0000-000000000003', 'Maaza'),
  ('11111111-0000-0000-0000-000000000004', 'Fanta');

-- Variants
insert into product_variants (id, product_id, variant_name, bottles_per_case, price_per_case, free_bottles_per_case) values
  -- Sprite
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '200ml', 24, 240.00, 0),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '500ml', 24, 480.00, 1),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '1L',   12, 420.00, 2),
  -- Coca Cola
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', '200ml', 24, 240.00, 0),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', '500ml', 24, 480.00, 1),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002', '1L',   12, 420.00, 2),
  -- Maaza
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000003', '200ml', 24, 220.00, 0),
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000003', '600ml', 24, 460.00, 1),
  -- Fanta
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000004', '200ml', 24, 220.00, 0),
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000004', '500ml', 24, 460.00, 1);

-- Sample Orders
insert into orders (id, customer_name, status, total_amount, created_at) values
  ('33333333-0000-0000-0000-000000000001', 'Ramesh Store', 'pending',   2400.00, now() - interval '2 hours'),
  ('33333333-0000-0000-0000-000000000002', 'Suresh Kirana', 'pending',  1920.00, now() - interval '1 hour'),
  ('33333333-0000-0000-0000-000000000003', 'Mohan General', 'delivered', 960.00, now() - interval '1 day'),
  ('33333333-0000-0000-0000-000000000004', 'Kishan Mart',   'delivered', 840.00, now() - interval '2 days');

-- Order Items
insert into order_items (order_id, variant_id, cases, free_bottles, total_bottles, amount, price_per_case_snapshot) values
  -- Ramesh Store: 5 cases Sprite 500ml
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 5, 5, 125, 2400.00, 480.00),
  -- Suresh Kirana: 4 cases Coca Cola 500ml
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', 4, 4, 100, 1920.00, 480.00),
  -- Mohan General: 2 cases Sprite 1L
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', 2, 4, 28,  840.00, 420.00),
  -- Kishan Mart: 2 cases Maaza 600ml
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000008', 2, 2, 50,  920.00, 460.00);

-- Payments (for delivered orders)
insert into payments (order_id, payment_type, amount) values
  ('33333333-0000-0000-0000-000000000003', 'cash',   960.00),
  ('33333333-0000-0000-0000-000000000004', 'credit', 840.00);
