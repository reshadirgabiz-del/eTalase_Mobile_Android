-- Track non-refundable promo credit separately (e.g. onboarding bonus)
ALTER TABLE account_credits
  ADD COLUMN promo_balance_idr integer NOT NULL DEFAULT 0 CHECK (promo_balance_idr >= 0);

-- Allow 'promo' and 'cancelled' transaction/refund types
ALTER TABLE credit_transactions
  DROP CONSTRAINT credit_transactions_type_check;
ALTER TABLE credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
    CHECK (type IN ('topup', 'deduction', 'refund', 'promo'));

-- Fix: refund requests were missing 'cancelled' status in the CHECK
ALTER TABLE credit_refund_requests
  DROP CONSTRAINT credit_refund_requests_status_check;
ALTER TABLE credit_refund_requests
  ADD CONSTRAINT credit_refund_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
