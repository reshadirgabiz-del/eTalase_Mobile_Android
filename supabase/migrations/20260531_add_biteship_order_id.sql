-- Add Biteship order tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS biteship_order_id text;
