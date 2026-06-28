-- Order history links
-- Run this query in the Supabase SQL editor before deploying the application changes.

ALTER TABLE order_links
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'preset',
  ADD COLUMN IF NOT EXISTS customer_label TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_links_link_type_check'
      AND conrelid = 'order_links'::regclass
  ) THEN
    ALTER TABLE order_links
      ADD CONSTRAINT order_links_link_type_check
      CHECK (link_type IN ('preset', 'history'));
  END IF;
END $$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_link_id UUID
  REFERENCES order_links(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID
  REFERENCES product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_order_link_successful
  ON orders(order_link_id, created_at DESC)
  WHERE status IN ('paid', 'processing', 'shipped', 'delivered');

CREATE INDEX IF NOT EXISTS idx_order_links_store_type
  ON order_links(store_id, link_type, created_at DESC);

COMMENT ON COLUMN order_links.link_type IS
  'preset: merchant-selected items; history: latest successful linked order';
COMMENT ON COLUMN order_links.customer_label IS
  'Merchant-facing customer label for a history link';
COMMENT ON COLUMN orders.order_link_id IS
  'Order link that initiated this checkout; used by history links';
