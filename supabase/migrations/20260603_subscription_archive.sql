-- Archive flag for subscriptions (soft-delete for UI cleanup)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
