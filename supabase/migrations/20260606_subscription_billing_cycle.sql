-- Add billing_cycle to subscriptions for monthly / annual tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly';
