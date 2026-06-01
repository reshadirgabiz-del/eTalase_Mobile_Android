-- Proof of transfer for credit topup requests
ALTER TABLE credit_topup_requests
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMPTZ;

-- In-dashboard notification center
CREATE TABLE IF NOT EXISTS store_notifications (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id       UUID         NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id        TEXT         NOT NULL,
  type           TEXT         NOT NULL,
  title          TEXT         NOT NULL,
  body           TEXT         NOT NULL,
  metadata       JSONB        NOT NULL DEFAULT '{}',
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_notifications_lookup_idx
  ON store_notifications(store_id, user_id, read_at);

CREATE INDEX IF NOT EXISTS store_notifications_created_idx
  ON store_notifications(created_at DESC);
