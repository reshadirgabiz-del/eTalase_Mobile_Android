-- Promo code reservation system.
--
-- reserved_usages: slots held by pending (unpaid) orders.
-- current_usages:  slots confirmed by paid orders.
-- The max_usages check is: current_usages + reserved_usages >= max_usages.
--
-- This prevents two customers both paying with the same single-use code:
-- the second customer's order creation is rejected at checkout, not silently
-- after payment.

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS reserved_usages INT NOT NULL DEFAULT 0;

-- Atomically claims one usage slot. Returns true if the reservation succeeded,
-- false if the code is already fully reserved/used. Uses FOR UPDATE to serialize
-- concurrent checkouts on the same promo code row.
CREATE OR REPLACE FUNCTION reserve_promo_usage(p_promo_code_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  v_max_usages     INT;
  v_current        INT;
  v_reserved       INT;
BEGIN
  SELECT max_usages, current_usages, reserved_usages
    INTO v_max_usages, v_current, v_reserved
    FROM promo_codes
   WHERE id = p_promo_code_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_max_usages IS NOT NULL AND v_current + v_reserved >= v_max_usages THEN
    RETURN false;
  END IF;

  UPDATE promo_codes
     SET reserved_usages = reserved_usages + 1
   WHERE id = p_promo_code_id;

  RETURN true;
END;
$$;

-- Moves a reservation to a confirmed usage on payment success.
CREATE OR REPLACE FUNCTION confirm_promo_usage(p_promo_code_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE promo_codes
     SET current_usages  = current_usages + 1,
         reserved_usages = GREATEST(reserved_usages - 1, 0)
   WHERE id = p_promo_code_id;
$$;

-- Releases a reservation on payment failure/expiry, making the slot available again.
CREATE OR REPLACE FUNCTION release_promo_reservation(p_promo_code_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE promo_codes
     SET reserved_usages = GREATEST(reserved_usages - 1, 0)
   WHERE id = p_promo_code_id;
$$;

-- Remove the simpler increment function that this system replaces.
DROP FUNCTION IF EXISTS increment_promo_usage(uuid);
