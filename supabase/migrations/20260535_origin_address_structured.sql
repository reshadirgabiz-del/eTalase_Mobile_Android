alter table settings
  add column if not exists origin_city        text,
  add column if not exists origin_province    text,
  add column if not exists origin_postal_code text;
