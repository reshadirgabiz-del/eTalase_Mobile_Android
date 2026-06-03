CREATE TABLE IF NOT EXISTS admin_push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT admin_push_tokens_unique UNIQUE (token)
);
