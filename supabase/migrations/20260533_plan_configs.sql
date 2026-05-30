-- Stores per-plan config overrides editable from the admin page.
-- Rows in this table take precedence over the static plans.config.ts defaults.
-- If a plan has no row here, the backend uses its hardcoded defaults.

create table if not exists plan_configs (
  plan_key  text        primary key,
  config    jsonb       not null default '{}',
  updated_at timestamptz not null default now()
);
