-- Add archive support to orders and products
ALTER TABLE orders   ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_is_archived   ON orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
