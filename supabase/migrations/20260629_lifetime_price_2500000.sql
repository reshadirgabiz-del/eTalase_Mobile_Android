-- Keep any live admin override aligned with the advertised one-time price.
insert into plan_configs (plan_key, config, updated_at)
values ('lifetime', '{"priceIdr": 2500000}'::jsonb, now())
on conflict (plan_key) do update
set config = coalesce(plan_configs.config, '{}'::jsonb) || '{"priceIdr": 2500000}'::jsonb,
    updated_at = now();
