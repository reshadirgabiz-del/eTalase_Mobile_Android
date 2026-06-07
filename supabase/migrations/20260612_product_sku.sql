-- Custom SKU on products and variants.
-- Optional; when blank, the product/variant id is used in displays.
-- Unique per store (case-insensitive). Variant SKU is unique within a product.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku text;

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS sku text;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS sku text;

-- Case-insensitive uniqueness per store, ignoring blanks.
CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_unique
  ON products (store_id, lower(sku))
  WHERE sku IS NOT NULL AND sku <> '';

-- Variant SKU only needs to be unique within its parent product
-- (the composed display "[parent]-[variant]" then becomes globally unique).
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_sku_unique
  ON product_variants (product_id, lower(sku))
  WHERE sku IS NOT NULL AND sku <> '';
