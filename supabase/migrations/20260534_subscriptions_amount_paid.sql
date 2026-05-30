-- Track amount paid per subscription for app revenue reporting
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
