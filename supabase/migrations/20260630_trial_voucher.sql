-- Trial vouchers: a coupon that grants a time-limited Lifetime entitlement on
-- one chosen store, redeemable at most once per account.

ALTER TABLE plan_vouchers
  ADD COLUMN IF NOT EXISTS grants_trial BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER;

ALTER TABLE plan_vouchers
  DROP CONSTRAINT IF EXISTS plan_vouchers_trial_requires_duration;
ALTER TABLE plan_vouchers
  ADD CONSTRAINT plan_vouchers_trial_requires_duration
  CHECK (
    NOT grants_trial
    OR (trial_duration_days IS NOT NULL AND trial_duration_days > 0)
  );

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS trial_redemptions (
  user_id TEXT PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES plan_vouchers(id),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS trial_redemptions_voucher_idx
  ON trial_redemptions(voucher_id);

-- Default 30-day Lifetime trial code. discount_type / discount_value are
-- required NOT NULL on plan_vouchers — populated with placeholders since the
-- trial path bypasses the standard discount math.
INSERT INTO plan_vouchers (
  code,
  discount_type,
  discount_value,
  max_usages,
  is_active,
  applicable_plan,
  grants_trial,
  trial_duration_days
) VALUES (
  'TRIAL30',
  'percent',
  100,
  NULL,
  TRUE,
  'lifetime',
  TRUE,
  30
) ON CONFLICT (code) DO NOTHING;
