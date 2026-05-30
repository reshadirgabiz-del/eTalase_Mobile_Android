alter table products
  add column if not exists subtitle        text,
  add column if not exists discounted_price numeric(12, 2) check (discounted_price >= 0);
