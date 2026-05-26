ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS enabled_couriers text[] NOT NULL DEFAULT '{}'::text[];
