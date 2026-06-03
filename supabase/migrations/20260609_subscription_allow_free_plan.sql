-- Allow 'free' in subscriptions.plan so auto-downgrade rows can be inserted.
-- Prior to this, applyPlanExpiry() silently failed for users whose paid plan
-- expired, leaving them stuck in 'expired' status with no free-tier fallback row.

-- Drop any existing CHECK constraint on the plan column. The original constraint
-- was declared inline so its auto-generated name isn't guaranteed.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and contype  = 'c'
      and pg_get_constraintdef(oid) ilike '%plan%in%'
  loop
    execute format('alter table subscriptions drop constraint %I', c.conname);
  end loop;
end $$;

alter table subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'starter', 'growth', 'business', 'enterprise'));
