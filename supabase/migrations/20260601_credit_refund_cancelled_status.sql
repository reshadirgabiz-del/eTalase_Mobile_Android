-- Allow user-initiated cancellation of refund requests
ALTER TABLE credit_refund_requests
  DROP CONSTRAINT IF EXISTS credit_refund_requests_status_check;

ALTER TABLE credit_refund_requests
  ADD CONSTRAINT credit_refund_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
