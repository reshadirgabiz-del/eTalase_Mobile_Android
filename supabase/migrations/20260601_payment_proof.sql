-- Payment proof upload for manual transfer subscriptions

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_submitted_at TIMESTAMPTZ;
