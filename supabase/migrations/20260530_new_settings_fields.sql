-- New settings fields: multi-currency, flat-rate delivery, social links

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS flat_rate_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flat_rate_delivery_price INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flat_rate_delivery_name TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]';
