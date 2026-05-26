-- ============================================================
-- Subscriptions — platform billing plan per owner account
-- plan: starter | growth | business | enterprise
-- status: pending | active | expired | cancelled
-- expires_at: set when subscription is activated via webhook
-- ============================================================

create table if not exists subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null,
  plan               text not null check (plan in ('starter', 'growth', 'business', 'enterprise')),
  status             text not null default 'pending'
                       check (status in ('pending', 'active', 'expired', 'cancelled')),
  expires_at         timestamptz,
  midtrans_order_id  text,
  midtrans_token     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table subscriptions enable row level security;

create index if not exists subscriptions_user_id_idx     on subscriptions(user_id);
create index if not exists subscriptions_status_idx      on subscriptions(status);
create index if not exists subscriptions_order_id_idx    on subscriptions(midtrans_order_id);

create or replace trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();
