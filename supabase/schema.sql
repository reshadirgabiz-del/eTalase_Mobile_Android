-- ============================================================
-- Jastip Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";


-- ============================================================
-- STORES
-- ============================================================
create table if not exists stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo_url   text,
  created_at timestamptz not null default now()
);

alter table stores enable row level security;


-- ============================================================
-- STORE MEMBERS
-- role: owner | admin | staff
-- user_id is null when an invite has been sent but the user
-- hasn't signed up in Clerk yet (pending invite by email).
-- ============================================================
create table if not exists store_members (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references stores(id) on delete cascade,
  user_id    text,                         -- Clerk userId, nullable for pending invites
  email      text not null,
  role       text not null check (role in ('owner', 'admin', 'delivery')),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

alter table store_members enable row level security;

create index if not exists store_members_user_id_idx  on store_members(user_id);
create index if not exists store_members_store_id_idx on store_members(store_id);


-- ============================================================
-- SETTINGS  (one row per store)
-- ============================================================
create table if not exists settings (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null unique references stores(id) on delete cascade,
  store_name           text,
  store_description    text,
  logo_url             text,
  midtrans_server_key  text,
  midtrans_client_key  text,
  origin_address       text,
  origin_lat           double precision,
  origin_lng           double precision,
  updated_at           timestamptz not null default now()
);

alter table settings enable row level security;


-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(12, 2) not null check (price >= 0),
  image_url   text,
  stock       integer not null default 0 check (stock >= 0),
  tags        text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table products enable row level security;

create index if not exists products_store_id_idx  on products(store_id);
create index if not exists products_is_active_idx on products(is_active);


-- ============================================================
-- ORDERS
-- status flow: pending → paid → processing → shipped → delivered
--              any state → cancelled
-- ============================================================
create table if not exists orders (
  id                    uuid primary key default gen_random_uuid(),
  store_id              uuid not null references stores(id),
  status                text not null default 'pending'
                          check (status in ('pending','paid','processing','shipped','delivered','cancelled')),

  -- Financials
  subtotal              numeric(12, 2) not null,
  delivery_price        numeric(12, 2) not null,
  total                 numeric(12, 2) not null,

  -- Recipient
  recipient_name        text not null,
  phone                 text not null,
  street                text not null,
  city                  text not null,
  province              text not null,
  postal_code           text not null,
  notes                 text,

  -- Delivery
  courier_id            text,
  courier_name          text,
  courier_code          text,
  service_name          text,
  service_type          text,
  estimated_days        integer,

  -- Midtrans
  midtrans_token        text,
  midtrans_redirect_url text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table orders enable row level security;

create index if not exists orders_store_id_idx on orders(store_id);
create index if not exists orders_status_idx   on orders(status);


-- ============================================================
-- ORDER ITEMS  (snapshot of price/name at purchase time)
-- ============================================================
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  price        numeric(12, 2) not null,
  quantity     integer not null check (quantity > 0)
);

alter table order_items enable row level security;

create index if not exists order_items_order_id_idx on order_items(order_id);


-- ============================================================
-- ORDER ATTACHMENTS
-- ============================================================
create table if not exists order_attachments (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  file_path  text not null,
  file_name  text not null,
  mime_type  text,
  created_at timestamptz not null default now()
);

alter table order_attachments enable row level security;

create index if not exists order_attachments_order_id_idx on order_attachments(order_id);


-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

create or replace trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create or replace trigger settings_updated_at
  before update on settings
  for each row execute function set_updated_at();


-- ============================================================
-- STORAGE BUCKET
-- order-attachments is private; the backend returns signed URLs.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('order-attachments', 'order-attachments', false)
on conflict (id) do nothing;
