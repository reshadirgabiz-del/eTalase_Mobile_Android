-- Notification preferences per user per store per topic.
-- Defaults to all channels enabled (NULL row = fully enabled).

CREATE TABLE IF NOT EXISTS notification_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL,                            -- Clerk user ID
  store_id      uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  topic         text NOT NULL
                  CHECK (topic IN ('order_status', 'low_stock', 'bank_transfer_proof')),
  push_enabled  boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user_store
  ON notification_preferences (user_id, store_id);
