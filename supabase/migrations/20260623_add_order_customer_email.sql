-- Capture customer contact at checkout so the platform can email follow-ups
-- (incomplete-payment reminders, status updates, tracking).
alter table public.orders
  add column if not exists customer_email text,
  add column if not exists customer_whatsapp text,
  add column if not exists reminder_sent_at timestamptz;

-- Index used by the pending-order reminder sweep.
create index if not exists orders_pending_reminder_idx
  on public.orders (status, reminder_sent_at, created_at)
  where status = 'pending';

notify pgrst, 'reload schema';
