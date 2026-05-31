-- Plan prices table: one row per plan, editable from admin
CREATE TABLE IF NOT EXISTS plan_prices (
  plan text PRIMARY KEY,
  price_idr integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO plan_prices (plan, price_idr) VALUES
  ('starter', 0),
  ('growth', 149000),
  ('business', 299000),
  ('enterprise', 599000)
ON CONFLICT (plan) DO NOTHING;

-- Add applicable_plan to plan_vouchers (null = applies to all plans)
ALTER TABLE plan_vouchers
  ADD COLUMN IF NOT EXISTS applicable_plan text;
