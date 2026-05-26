-- Add promo_discount column to orders (amount saved from promo codes)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_discount INT NOT NULL DEFAULT 0;

-- Promo codes defined by merchants
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'absolute')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  -- 'total' = grand total, 'products' = product subtotal, 'delivery' = delivery fee
  applies_to TEXT NOT NULL DEFAULT 'total' CHECK (applies_to IN ('total', 'products', 'delivery')),
  -- NULL means all products; only relevant when applies_to = 'products'
  product_ids UUID[] DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  max_usages INT DEFAULT NULL,
  current_usages INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, code)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_store_id ON promo_codes(store_id);

-- Records which promo codes were applied to each order (for analytics and audit)
CREATE TABLE IF NOT EXISTS order_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  code TEXT NOT NULL,
  discount_amount INT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_promo_codes_order_id ON order_promo_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_promo_codes_promo_code_id ON order_promo_codes(promo_code_id);
