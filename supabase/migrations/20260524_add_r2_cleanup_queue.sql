create table if not exists r2_cleanup_queue (
  id         uuid primary key default gen_random_uuid(),
  blob_key   text not null unique,
  blob_url   text not null,
  warned_at  timestamptz not null default now()
);

alter table r2_cleanup_queue enable row level security;
-- No RLS policies: only accessible via the service-role key used by the backend.
