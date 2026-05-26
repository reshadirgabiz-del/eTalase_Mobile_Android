-- ============================================================
-- Jastip Platform — Initial Seed
-- Run AFTER schema.sql.
-- Replace the placeholder Clerk user ID before running.
-- ============================================================

-- 1. Create the store
insert into stores (id, name)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'My Jastip Store'
);

-- 2. Link the owner
--    Replace 'user_clerk_id_here' with the actual Clerk userId
--    (visible in the Clerk dashboard under Users).
insert into store_members (store_id, user_id, email, role)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'user_clerk_id_here',
  'owner@example.com',
  'owner'
);

-- 3. Default settings for the store
insert into settings (store_id, store_name, store_description)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'My Jastip Store',
  'Welcome to my store!'
);
