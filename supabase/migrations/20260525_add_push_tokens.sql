CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT push_tokens_unique UNIQUE (user_id, store_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_store_id ON push_tokens(store_id);
