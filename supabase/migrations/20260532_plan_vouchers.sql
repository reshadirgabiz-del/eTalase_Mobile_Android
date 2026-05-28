-- Plan vouchers: discount codes for subscription purchases, managed from Supabase
CREATE TABLE IF NOT EXISTS plan_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'absolute')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_usages INTEGER,        -- NULL = unlimited
  current_usages INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,    -- NULL = no expiry
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS plan_vouchers_code_idx ON plan_vouchers (UPPER(code));
