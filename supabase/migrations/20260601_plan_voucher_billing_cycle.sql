-- Add billing cycle targeting to plan vouchers
ALTER TABLE plan_vouchers
  ADD COLUMN IF NOT EXISTS applicable_billing_cycle TEXT
  CHECK (applicable_billing_cycle IN ('monthly', 'annual'));
