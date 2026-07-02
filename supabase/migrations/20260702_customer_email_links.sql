ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS auto_share_history_link BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS customer_catalogue_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN settings.auto_share_history_link IS
  'Automatically create and include a permanent reorder-history link in successful order status emails';
COMMENT ON COLUMN settings.customer_catalogue_url IS
  'Optional catalogue URL included in successful order status emails';
