-- Replace account-wide expiring subscriptions with a permanent entitlement per store.
alter table subscriptions
  add column if not exists store_id uuid references stores(id) on delete cascade;

alter table subscriptions drop constraint if exists subscriptions_plan_check;
alter table subscriptions
  add constraint subscriptions_plan_check check (plan in ('free', 'lifetime')) not valid;

create index if not exists subscriptions_store_id_idx on subscriptions(store_id);
create unique index if not exists subscriptions_one_active_lifetime_per_store_idx
  on subscriptions(store_id)
  where plan = 'lifetime' and status = 'active';

-- Launch transition: every store that already exists receives Lifetime.
insert into subscriptions (
  user_id,
  store_id,
  plan,
  status,
  expires_at,
  midtrans_order_id,
  billing_cycle,
  amount_paid
)
select
  owner.user_id,
  owner.store_id,
  'lifetime',
  'active',
  null,
  'MIGRATION-LIFETIME-' || owner.store_id::text,
  'monthly',
  0
from store_members owner
where owner.role = 'owner'
  and owner.user_id is not null
  and not exists (
    select 1
    from subscriptions existing
    where existing.store_id = owner.store_id
      and existing.plan = 'lifetime'
      and existing.status = 'active'
  );

-- Historical rows remain available for accounting, but no longer grant access.
update subscriptions
set status = 'cancelled', plan = 'lifetime', expires_at = null
where plan not in ('free', 'lifetime')
  ;

alter table subscriptions validate constraint subscriptions_plan_check;

comment on column subscriptions.store_id is
  'Store receiving this entitlement. Lifetime purchases are scoped to exactly one store.';
