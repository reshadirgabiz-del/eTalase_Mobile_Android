-- Optional per-variant weight. When NULL, the parent product's weight is used
-- for shipping calculations.

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS weight_grams int
    CHECK (weight_grams IS NULL OR weight_grams >= 500);
