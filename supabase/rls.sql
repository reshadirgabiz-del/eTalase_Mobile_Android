-- ============================================================
-- Jastip Platform — Row Level Security Policies
-- Run AFTER schema.sql.
--
-- Auth model: Clerk JWTs are passed to Supabase. The Clerk
-- userId lives in the JWT's `sub` claim, accessed here via
-- auth.jwt() ->> 'sub'.
--
-- To enable this, create a JWT template in the Clerk dashboard:
--   Clerk Dashboard → JWT Templates → New → Supabase
-- Then pass the Clerk session token to the Supabase client:
--   supabase.auth.setSession({ access_token: clerkToken, refresh_token: '' })
--
-- The NestJS backend always uses SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses all RLS. These policies protect against direct
-- client access (e.g., anon key from the browser).
-- ============================================================


-- ============================================================
-- HELPER: extracts the Clerk userId from the JWT sub claim
-- ============================================================
create or replace function requesting_user_id()
returns text
language sql stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;


-- ============================================================
-- STORES
-- Visible only to members of that store.
-- All writes go through the backend (service role).
-- ============================================================
create policy "members can view their store"
  on stores for select
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = stores.id
        and store_members.user_id  = requesting_user_id()
    )
  );


-- ============================================================
-- STORE MEMBERS
-- ============================================================

-- Any member of a store can see the full member list.
create policy "members can view store members"
  on store_members for select
  using (
    exists (
      select 1 from store_members sm
      where sm.store_id = store_members.store_id
        and sm.user_id  = requesting_user_id()
    )
  );

-- Only owners may invite new members.
create policy "owners can add members"
  on store_members for insert
  with check (
    exists (
      select 1 from store_members sm
      where sm.store_id = store_members.store_id
        and sm.user_id  = requesting_user_id()
        and sm.role     = 'owner'
    )
  );

-- Only owners may remove members.
create policy "owners can remove members"
  on store_members for delete
  using (
    exists (
      select 1 from store_members sm
      where sm.store_id = store_members.store_id
        and sm.user_id  = requesting_user_id()
        and sm.role     = 'owner'
    )
  );


-- ============================================================
-- SETTINGS
-- ============================================================

-- Any member can read settings (needed for storefront config).
create policy "members can view settings"
  on settings for select
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = settings.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );

-- Only owners can update settings.
create policy "owners can update settings"
  on settings for update
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = settings.store_id
        and store_members.user_id  = requesting_user_id()
        and store_members.role     = 'owner'
    )
  );


-- ============================================================
-- PRODUCTS
-- Two SELECT policies — Postgres ORs them together:
--   • Anonymous visitors see active products (public storefront).
--   • Store members see all products, including inactive ones.
-- ============================================================

create policy "public can view active products"
  on products for select
  using (is_active = true);

create policy "members can view all store products"
  on products for select
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = products.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );

create policy "members can create products"
  on products for insert
  with check (
    exists (
      select 1 from store_members
      where store_members.store_id = products.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );

create policy "members can update products"
  on products for update
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = products.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );

create policy "members can delete products"
  on products for delete
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = products.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );


-- ============================================================
-- ORDERS
-- Anyone (including unauthenticated visitors) can place an order.
-- Only store members can read or update orders.
-- ============================================================

create policy "anyone can place an order"
  on orders for insert
  with check (true);

create policy "members can view store orders"
  on orders for select
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = orders.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );

create policy "members can update order status"
  on orders for update
  using (
    exists (
      select 1 from store_members
      where store_members.store_id = orders.store_id
        and store_members.user_id  = requesting_user_id()
    )
  );


-- ============================================================
-- ORDER ITEMS
-- Created during checkout (same transaction as the order),
-- so insert is public. Reads are restricted to store members.
-- ============================================================

create policy "anyone can insert order items"
  on order_items for insert
  with check (true);

create policy "members can view order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      join store_members
        on store_members.store_id = orders.store_id
      where orders.id            = order_items.order_id
        and store_members.user_id = requesting_user_id()
    )
  );


-- ============================================================
-- ORDER ATTACHMENTS
-- ============================================================

create policy "members can upload attachments"
  on order_attachments for insert
  with check (
    exists (
      select 1 from orders
      join store_members
        on store_members.store_id = orders.store_id
      where orders.id            = order_attachments.order_id
        and store_members.user_id = requesting_user_id()
    )
  );

create policy "members can view attachments"
  on order_attachments for select
  using (
    exists (
      select 1 from orders
      join store_members
        on store_members.store_id = orders.store_id
      where orders.id            = order_attachments.order_id
        and store_members.user_id = requesting_user_id()
    )
  );


-- ============================================================
-- STORAGE — order-attachments bucket
-- File paths follow the pattern: {orderId}/{timestamp}-{filename}
-- The first folder segment is the order UUID, used to check
-- membership before allowing access.
-- ============================================================

create policy "members can upload to order-attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'order-attachments'
    and exists (
      select 1 from orders
      join store_members
        on store_members.store_id = orders.store_id
      where orders.id::text      = (storage.foldername(name))[1]
        and store_members.user_id = requesting_user_id()
    )
  );

create policy "members can read from order-attachments"
  on storage.objects for select
  using (
    bucket_id = 'order-attachments'
    and exists (
      select 1 from orders
      join store_members
        on store_members.store_id = orders.store_id
      where orders.id::text      = (storage.foldername(name))[1]
        and store_members.user_id = requesting_user_id()
    )
  );
