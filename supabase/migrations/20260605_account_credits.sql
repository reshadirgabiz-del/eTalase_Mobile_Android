-- Account credit balances: one row per user
CREATE TABLE account_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  balance_idr integer NOT NULL DEFAULT 0 CHECK (balance_idr >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Full ledger of all credit movements
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount_idr integer NOT NULL,  -- positive = credit, negative = debit
  type text NOT NULL CHECK (type IN ('topup', 'deduction', 'refund')),
  description text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pending manual-transfer topup requests
CREATE TABLE credit_topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount_idr integer NOT NULL CHECK (amount_idr >= 50000),
  unique_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

-- Refund requests with bank details
CREATE TABLE credit_refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount_idr integer NOT NULL CHECK (amount_idr > 0),
  message text,
  bank_name text NOT NULL,
  bank_account_number text NOT NULL,
  bank_account_name text NOT NULL,
  contact_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_account_credits_user_id ON account_credits (user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions (user_id);
CREATE INDEX idx_credit_topup_requests_status ON credit_topup_requests (status);
CREATE INDEX idx_credit_refund_requests_status ON credit_refund_requests (status);
