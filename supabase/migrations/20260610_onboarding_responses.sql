-- Onboarding survey responses — one row per user (upsert on replay)
CREATE TABLE onboarding_responses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          text        NOT NULL UNIQUE,

  -- Survey answers
  name             text,
  age_range        text,
  is_selling       boolean,
  selling_duration text,
  product_category text,
  top_product_name      text,
  top_product_category  text,
  monthly_revenue       integer,
  product_price         integer,

  -- Marketplace setup
  shopee_seller_type    text,
  shopee_gratis_ongkir  boolean DEFAULT false,
  shopee_promo_xtra     boolean DEFAULT false,
  tokopedia_seller_type text,
  tokopedia_is_pre_order boolean DEFAULT false,

  -- Lifecycle
  credit_granted   boolean     NOT NULL DEFAULT false,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_responses_user_id ON onboarding_responses (user_id);
