ALTER TABLE order_links
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN NOT NULL DEFAULT false;

-- Allow expires_at to be NULL for permanent links
ALTER TABLE order_links ALTER COLUMN expires_at DROP NOT NULL;
