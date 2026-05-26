-- Add usage conditions to promo codes
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS min_subtotal INT DEFAULT NULL;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS min_quantity INT DEFAULT NULL;
