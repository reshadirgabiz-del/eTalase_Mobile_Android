-- ============================================================
-- Legal acceptance + audit logging
-- ============================================================

-- Per-user record of accepted Terms and Privacy versions.
create table if not exists legal_acceptances (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  document_type   text not null check (document_type in ('terms', 'privacy')),
  document_version text not null,
  accepted_at     timestamptz not null default now(),
  ip_address      text,
  user_agent      text,
  unique (user_id, document_type, document_version)
);

create index if not exists idx_legal_acceptances_user
  on legal_acceptances (user_id);

create index if not exists idx_legal_acceptances_user_doc
  on legal_acceptances (user_id, document_type);

-- Audit log for sensitive actions. `actor_user_id` is the user performing the
-- action (nullable for system / public endpoints like webhook callbacks).
create table if not exists audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   text,
  action          text not null,
  target_type     text,
  target_id       text,
  store_id        uuid,
  metadata        jsonb not null default '{}'::jsonb,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor      on audit_logs (actor_user_id);
create index if not exists idx_audit_logs_action     on audit_logs (action);
create index if not exists idx_audit_logs_store      on audit_logs (store_id);
create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);

-- Extra columns on push_tokens to support a "trusted devices" UI: users can
-- recognize and revoke a device from the dashboard.
alter table push_tokens add column if not exists device_label  text;
alter table push_tokens add column if not exists platform      text;
alter table push_tokens add column if not exists last_seen_at  timestamptz;
