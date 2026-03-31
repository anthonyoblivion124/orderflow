-- Run in Supabase SQL Editor
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  role text not null check (role in ('admin', 'manager', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role text primary key check (role in ('manager', 'viewer')),
  permissions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  order_date date not null,
  currency text not null,
  currency_rate numeric(14, 4) not null default 1,
  status text not null check (status in ('Pending', 'Payment Required', 'Completed')),
  notes text,
  grand_total numeric(18, 2) not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  item_code text,
  name text not null,
  quantity numeric(18, 2) not null,
  price numeric(18, 2) not null,
  total numeric(18, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_order_payments (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  method text not null,
  amount numeric(18, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_print_rows (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  row_index integer not null default 0,
  company_name text,
  total numeric(18, 2),
  discount_ysb numeric(18, 2),
  discount_gift numeric(18, 2),
  discount_shop_discount numeric(18, 2),
  wholesale_customer_name text,
  wholesale_company_name text,
  wholesale_total numeric(18, 2),
  debt_customer_name text,
  debt_company_name text,
  debt_total numeric(18, 2),
  quantity numeric(18, 2),
  pos_amount numeric(18, 2),
  change_amount numeric(18, 2),
  pos_amount_and_change numeric(18, 2),
  cash_received numeric(18, 2),
  banking_kpay_personal numeric(18, 2),
  banking_kpay_qr numeric(18, 2),
  banking_aya_pay numeric(18, 2),
  banking_kbz_bank numeric(18, 2),
  banking_aya_bank numeric(18, 2),
  banking_mab_bank numeric(18, 2),
  surplus_deficit numeric(18, 2),
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_print_rows_report_date
  on public.daily_print_rows(report_date, row_index);

-- Optional: starter role permissions
insert into public.role_permissions(role, permissions)
values
  ('manager', '{"viewPurchaseOrders": true, "managePurchaseOrders": true, "viewSuppliers": true, "manageSuppliers": true, "managePaymentMethods": true}'),
  ('viewer', '{"viewPurchaseOrders": true, "managePurchaseOrders": false, "viewSuppliers": true, "manageSuppliers": false, "managePaymentMethods": false}')
on conflict (role) do nothing;
