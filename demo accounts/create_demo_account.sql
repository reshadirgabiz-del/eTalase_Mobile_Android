-- ============================================================
-- e-talase demo account data
-- Run after supabase/schema.sql and migrations.
--
-- Before running:
--   1) Create the demo user in Clerk.
--   2) Create the store from the app while signed in as that user.
--   3) Replace REPLACE_WITH_CLERK_USER_ID below with the Clerk user ID.
--   4) Replace REPLACE_WITH_STORE_ID below with the Supabase store ID.
-- ============================================================

do $$
declare
  v_owner_user_id text := 'user_3FUHQjih0lwLc4ipNzF9o5jxUI3';
  v_owner_email text := 'info@mail.e-talase.com';

  v_store_id_input text := '583e6139-c4cb-4037-beb1-0f787867ff90';
  v_store_id uuid;
  v_location_main_id uuid;
  v_location_backup_id uuid := 'dddddddd-0000-0000-0000-000000000102';

  v_product_bag_id uuid := 'eeeeeeee-0000-0000-0000-000000000001';
  v_product_sneaker_id uuid := 'eeeeeeee-0000-0000-0000-000000000002';
  v_product_skincare_id uuid := 'eeeeeeee-0000-0000-0000-000000000003';
  v_product_watch_id uuid := 'eeeeeeee-0000-0000-0000-000000000004';
  v_product_chocolate_id uuid := 'eeeeeeee-0000-0000-0000-000000000005';

  v_promo_welcome_id uuid := 'eeeeeeee-0000-0000-0000-000000000101';
  v_promo_ship_id uuid := 'eeeeeeee-0000-0000-0000-000000000102';

  v_order_pending_id uuid := 'ffffffff-0000-0000-0000-000000000001';
  v_order_paid_id uuid := 'ffffffff-0000-0000-0000-000000000002';
  v_order_processing_id uuid := 'ffffffff-0000-0000-0000-000000000003';
  v_order_shipped_id uuid := 'ffffffff-0000-0000-0000-000000000004';
  v_order_delivered_id uuid := 'ffffffff-0000-0000-0000-000000000005';
  v_order_cancelled_id uuid := 'ffffffff-0000-0000-0000-000000000006';

  v_subscription_id uuid := 'dddddddd-0000-0000-0000-000000000201';
  v_credit_topup_id uuid := 'dddddddd-0000-0000-0000-000000000301';
  v_credit_refund_id uuid := 'dddddddd-0000-0000-0000-000000000302';
  v_order_link_permanent_id uuid := 'dddddddd-0000-0000-0000-000000000401';
  v_order_link_temporary_id uuid := 'dddddddd-0000-0000-0000-000000000402';
begin
  if v_owner_user_id = 'REPLACE_WITH_CLERK_USER_ID' then
    raise exception 'Replace REPLACE_WITH_CLERK_USER_ID with the real Clerk user ID before running this script.';
  end if;

  if v_store_id_input = 'REPLACE_WITH_STORE_ID' then
    raise exception 'Replace REPLACE_WITH_STORE_ID with the store ID created from the app.';
  end if;

  v_store_id := v_store_id_input::uuid;

  if not exists (select 1 from stores where id = v_store_id) then
    raise exception 'Store % does not exist. Create the store first, then rerun this script.', v_store_id;
  end if;

  if not exists (
    select 1 from store_members
    where store_id = v_store_id
      and user_id = v_owner_user_id
      and role = 'owner'
      and is_disabled = false
  ) then
    raise exception 'User % is not an active owner of store %. Create the store while signed in as this Clerk user.', v_owner_user_id, v_store_id;
  end if;

  insert into store_members (store_id, user_id, email, role, invitation_status, is_disabled)
  select v_store_id, null, 'demo.staff@example.com', 'admin', 'pending_email', false
  where not exists (
    select 1 from store_members
    where store_id = v_store_id and email = 'demo.staff@example.com'
  );

  update stores
     set logo_url = coalesce(logo_url, 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d')
   where id = v_store_id;

  insert into settings (
    store_id, store_name, store_description, logo_url,
    origin_address, origin_city, origin_province, origin_postal_code,
    origin_lat, origin_lng, hide_location, enabled_couriers,
    bank_transfer_enabled, bank_transfer_text, bank_account_number,
    bank_recipient_name, bank_name,
    flat_rate_delivery_enabled, flat_rate_delivery_price, flat_rate_delivery_name,
    currency, social_links
  )
  values (
    v_store_id,
    (select name from stores where id = v_store_id),
    'Demo jastip store for testing products, order links, payments, and shipments.',
    'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d',
    'Jl. Kemang Raya No. 12',
    'Jakarta Selatan',
    'DKI Jakarta',
    '12730',
    -6.2607,
    106.8119,
    false,
    array['jne', 'sicepat', 'jnt', 'grab'],
    true,
    'Transfer manual akan diverifikasi maksimal 1x24 jam.',
    '1234567890',
    'PT Etalase Demo Indonesia',
    'BCA',
    true,
    25000,
    'Same-day Jakarta',
    'IDR',
    '[{"platform":"instagram","url":"https://instagram.com/etalase.demo"},{"platform":"whatsapp","url":"https://wa.me/6281234567890"}]'::jsonb
  )
  on conflict (store_id) do update set
    store_name = excluded.store_name,
    store_description = excluded.store_description,
    logo_url = excluded.logo_url,
    origin_address = excluded.origin_address,
    origin_city = excluded.origin_city,
    origin_province = excluded.origin_province,
    origin_postal_code = excluded.origin_postal_code,
    origin_lat = excluded.origin_lat,
    origin_lng = excluded.origin_lng,
    hide_location = excluded.hide_location,
    enabled_couriers = excluded.enabled_couriers,
    bank_transfer_enabled = excluded.bank_transfer_enabled,
    bank_transfer_text = excluded.bank_transfer_text,
    bank_account_number = excluded.bank_account_number,
    bank_recipient_name = excluded.bank_recipient_name,
    bank_name = excluded.bank_name,
    flat_rate_delivery_enabled = excluded.flat_rate_delivery_enabled,
    flat_rate_delivery_price = excluded.flat_rate_delivery_price,
    flat_rate_delivery_name = excluded.flat_rate_delivery_name,
    currency = excluded.currency,
    social_links = excluded.social_links,
    updated_at = now();

  select id into v_location_main_id
  from store_locations
  where store_id = v_store_id and is_default
  limit 1;

  if v_location_main_id is null then
    v_location_main_id := 'dddddddd-0000-0000-0000-000000000101';

    insert into store_locations (
      id, store_id, name, address, city, province, postal_code, lat, lng, area_id, is_default
    )
    values (
      v_location_main_id, v_store_id, 'Gudang Kemang',
      'Jl. Kemang Raya No. 12', 'Jakarta Selatan', 'DKI Jakarta', '12730',
      -6.2607, 106.8119, 'IDNP6IDNC142IDND1761IDZ12730', true
    );
  else
    update store_locations
       set name = 'Gudang Kemang',
           address = 'Jl. Kemang Raya No. 12',
           city = 'Jakarta Selatan',
           province = 'DKI Jakarta',
           postal_code = '12730',
           lat = -6.2607,
           lng = 106.8119,
           area_id = 'IDNP6IDNC142IDND1761IDZ12730',
           updated_at = now()
     where id = v_location_main_id;
  end if;

  insert into store_locations (
    id, store_id, name, address, city, province, postal_code, lat, lng, area_id, is_default
  )
  values (
    v_location_backup_id, v_store_id, 'Pickup Bandung',
    'Jl. Riau No. 88', 'Bandung', 'Jawa Barat', '40115',
    -6.9086, 107.6101, 'IDNP9IDNC22IDND3273IDZ40115', false
  )
  on conflict (id) do update set
    name = excluded.name,
    address = excluded.address,
    city = excluded.city,
    province = excluded.province,
    postal_code = excluded.postal_code,
    lat = excluded.lat,
    lng = excluded.lng,
    area_id = excluded.area_id,
    is_default = excluded.is_default,
    updated_at = now();

  insert into subscriptions (
    id, user_id, plan, status, billing_cycle, expires_at, amount_paid,
    midtrans_order_id, created_at, updated_at
  )
  values (
    v_subscription_id,
    v_owner_user_id,
    'business',
    'active',
    'monthly',
    now() + interval '45 days',
    299000,
    'demo-subscription-business-001',
    now() - interval '15 days',
    now()
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    plan = excluded.plan,
    status = excluded.status,
    billing_cycle = excluded.billing_cycle,
    expires_at = excluded.expires_at,
    amount_paid = excluded.amount_paid,
    midtrans_order_id = excluded.midtrans_order_id,
    updated_at = now();

  insert into account_credits (user_id, balance_idr, promo_balance_idr)
  values (v_owner_user_id, 250000, 75000)
  on conflict (user_id) do update set
    balance_idr = excluded.balance_idr,
    promo_balance_idr = excluded.promo_balance_idr,
    updated_at = now();

  insert into credit_transactions (user_id, amount_idr, type, description, reference_id, created_at)
  select v_owner_user_id, 200000, 'topup', 'Demo confirmed top up', 'demo-topup-001', now() - interval '8 days'
  where not exists (
    select 1 from credit_transactions
    where user_id = v_owner_user_id and reference_id = 'demo-topup-001'
  );

  insert into credit_transactions (user_id, amount_idr, type, description, reference_id, created_at)
  select v_owner_user_id, 75000, 'promo', 'Demo onboarding promo credit', 'demo-onboarding-credit', now() - interval '10 days'
  where not exists (
    select 1 from credit_transactions
    where user_id = v_owner_user_id and reference_id = 'demo-onboarding-credit'
  );

  insert into credit_topup_requests (
    id, user_id, amount_idr, unique_code, status, proof_url, proof_submitted_at, created_at, confirmed_at
  )
  values (
    v_credit_topup_id, v_owner_user_id, 200000, '021', 'confirmed',
    'https://example.com/demo/topup-proof.jpg', now() - interval '8 days',
    now() - interval '8 days 1 hour', now() - interval '8 days'
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    amount_idr = excluded.amount_idr,
    unique_code = excluded.unique_code,
    status = excluded.status,
    proof_url = excluded.proof_url,
    proof_submitted_at = excluded.proof_submitted_at,
    confirmed_at = excluded.confirmed_at;

  insert into credit_refund_requests (
    id, user_id, amount_idr, message, bank_name, bank_account_number,
    bank_account_name, contact_email, status, created_at
  )
  values (
    v_credit_refund_id, v_owner_user_id, 50000,
    'Demo refund request for admin review.',
    'BCA', '1234567890', 'PT Etalase Demo Indonesia', v_owner_email,
    'pending', now() - interval '1 day'
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    amount_idr = excluded.amount_idr,
    message = excluded.message,
    bank_name = excluded.bank_name,
    bank_account_number = excluded.bank_account_number,
    bank_account_name = excluded.bank_account_name,
    contact_email = excluded.contact_email,
    status = excluded.status;

  insert into onboarding_responses (
    user_id, name, age_range, is_selling, selling_duration, product_category,
    top_product_name, top_product_category, monthly_revenue, product_price,
    shopee_seller_type, shopee_gratis_ongkir, shopee_promo_xtra,
    tokopedia_seller_type, tokopedia_is_pre_order,
    credit_granted, completed_at
  )
  values (
    v_owner_user_id, 'Demo Owner', '25-34', true, '1-3_years', 'fashion',
    'Tas Kulit Korea', 'fashion', 25000000, 750000,
    'star_seller', true, true, 'power_merchant', true,
    true, now() - interval '10 days'
  )
  on conflict (user_id) do update set
    name = excluded.name,
    age_range = excluded.age_range,
    is_selling = excluded.is_selling,
    selling_duration = excluded.selling_duration,
    product_category = excluded.product_category,
    top_product_name = excluded.top_product_name,
    top_product_category = excluded.top_product_category,
    monthly_revenue = excluded.monthly_revenue,
    product_price = excluded.product_price,
    shopee_seller_type = excluded.shopee_seller_type,
    shopee_gratis_ongkir = excluded.shopee_gratis_ongkir,
    shopee_promo_xtra = excluded.shopee_promo_xtra,
    tokopedia_seller_type = excluded.tokopedia_seller_type,
    tokopedia_is_pre_order = excluded.tokopedia_is_pre_order,
    credit_granted = excluded.credit_granted,
    completed_at = excluded.completed_at,
    updated_at = now();

  insert into products (
    id, store_id, location_id, name, subtitle, description, price,
    discounted_price, image_url, stock, tags, sku, is_active, is_archived
  )
  values
    (
      v_product_bag_id, v_store_id, v_location_main_id,
      'Tas Kulit Korea Premium', 'Ready warna coklat dan hitam',
      'Tas kulit premium dari Seoul dengan strap adjustable dan dust bag.',
      850000, 749000,
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c',
      12, array['fashion', 'korea', 'tas'], 'DEMO-BAG-001', true, false
    ),
    (
      v_product_sneaker_id, v_store_id, v_location_main_id,
      'Sneakers Japan Limited', 'Pre-order batch Tokyo',
      'Sneakers edisi terbatas dengan box original dan tag resmi.',
      1250000, null,
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      6, array['sepatu', 'japan', 'limited'], 'DEMO-SHOE-001', true, false
    ),
    (
      v_product_skincare_id, v_store_id, v_location_backup_id,
      'Skincare Korea Starter Set', '5 item lengkap',
      'Starter set skincare Korea untuk basic daily routine.',
      465000, 425000,
      'https://images.unsplash.com/photo-1556228720-195a672e8a03',
      24, array['skincare', 'korea', 'beauty'], 'DEMO-SKIN-001', true, false
    ),
    (
      v_product_watch_id, v_store_id, v_location_main_id,
      'Jam Tangan Minimal Swiss', 'Garansi toko 6 bulan',
      'Jam tangan analog desain minimal dengan strap kulit.',
      1750000, null,
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
      3, array['watch', 'swiss', 'premium'], 'DEMO-WATCH-001', true, false
    ),
    (
      v_product_chocolate_id, v_store_id, v_location_backup_id,
      'Chocolate Gift Box EU', 'Stok musiman',
      'Gift box cokelat impor Eropa cocok untuk hampers.',
      325000, null,
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b',
      0, array['gift', 'snack', 'europe'], 'DEMO-CHOCO-001', true, false
    )
  on conflict (id) do update set
    location_id = excluded.location_id,
    name = excluded.name,
    subtitle = excluded.subtitle,
    description = excluded.description,
    price = excluded.price,
    discounted_price = excluded.discounted_price,
    image_url = excluded.image_url,
    stock = excluded.stock,
    tags = excluded.tags,
    sku = excluded.sku,
    is_active = excluded.is_active,
    is_archived = excluded.is_archived,
    updated_at = now();

  insert into product_images (product_id, image_url, is_thumbnail, sort_order)
  select v_product_bag_id, 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c', true, 0
  where not exists (
    select 1 from product_images
    where product_id = v_product_bag_id and image_url = 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c'
  );

  insert into product_images (product_id, image_url, is_thumbnail, sort_order)
  select v_product_sneaker_id, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', true, 0
  where not exists (
    select 1 from product_images
    where product_id = v_product_sneaker_id and image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
  );

  insert into product_images (product_id, image_url, is_thumbnail, sort_order)
  select v_product_skincare_id, 'https://images.unsplash.com/photo-1556228720-195a672e8a03', true, 0
  where not exists (
    select 1 from product_images
    where product_id = v_product_skincare_id and image_url = 'https://images.unsplash.com/photo-1556228720-195a672e8a03'
  );

  insert into product_variants (product_id, name, price, discounted_price, stock, sort_order, sku, weight_grams, is_active)
  select *
  from (
    values
      (v_product_bag_id, 'Coklat'::text, 850000::numeric, 749000::numeric, 5, 0, 'DEMO-BAG-001-BRN'::text, 900, true),
      (v_product_bag_id, 'Hitam'::text, 850000::numeric, 749000::numeric, 7, 1, 'DEMO-BAG-001-BLK'::text, 900, true),
      (v_product_sneaker_id, 'EU 40'::text, 1250000::numeric, null::numeric, 2, 0, 'DEMO-SHOE-001-40'::text, 1100, true),
      (v_product_sneaker_id, 'EU 41'::text, 1250000::numeric, null::numeric, 2, 1, 'DEMO-SHOE-001-41'::text, 1100, true),
      (v_product_sneaker_id, 'EU 42'::text, 1250000::numeric, null::numeric, 2, 2, 'DEMO-SHOE-001-42'::text, 1100, true),
      (v_product_skincare_id, 'Normal Skin'::text, 465000::numeric, 425000::numeric, 12, 0, 'DEMO-SKIN-001-NOR'::text, 700, true),
      (v_product_skincare_id, 'Sensitive Skin'::text, 465000::numeric, 425000::numeric, 12, 1, 'DEMO-SKIN-001-SEN'::text, 700, true)
  ) as v(product_id, name, price, discounted_price, stock, sort_order, sku, weight_grams, is_active)
  where not exists (
    select 1 from product_variants pv
    where pv.product_id = v.product_id and lower(pv.sku) = lower(v.sku)
  );

  insert into promo_codes (
    id, store_id, code, discount_type, discount_value, applies_to,
    expires_at, max_usages, current_usages, reserved_usages,
    min_subtotal, min_quantity, is_active, created_by
  )
  values
    (
      v_promo_welcome_id, v_store_id, 'DEMO10', 'percent', 10, 'total',
      now() + interval '90 days', 100, 1, 0, 250000, 1, true, v_owner_user_id
    ),
    (
      v_promo_ship_id, v_store_id, 'ONGKIR25', 'absolute', 25000, 'delivery',
      now() + interval '30 days', 50, 0, 0, null, null, true, v_owner_user_id
    )
  on conflict (store_id, code) do update set
    discount_type = excluded.discount_type,
    discount_value = excluded.discount_value,
    applies_to = excluded.applies_to,
    expires_at = excluded.expires_at,
    max_usages = excluded.max_usages,
    current_usages = excluded.current_usages,
    reserved_usages = excluded.reserved_usages,
    min_subtotal = excluded.min_subtotal,
    min_quantity = excluded.min_quantity,
    is_active = excluded.is_active,
    created_by = excluded.created_by;

  insert into order_links (id, store_id, items, message, is_permanent, expires_at, created_by, created_at)
  values
    (
      v_order_link_permanent_id,
      v_store_id,
      jsonb_build_array(
        jsonb_build_object('productId', v_product_bag_id, 'quantity', 1),
        jsonb_build_object('productId', v_product_skincare_id, 'quantity', 1)
      ),
      'Paket favorit jastip Korea.',
      true,
      null,
      v_owner_user_id,
      now() - interval '7 days'
    ),
    (
      v_order_link_temporary_id,
      v_store_id,
      jsonb_build_array(jsonb_build_object('productId', v_product_sneaker_id, 'quantity', 1)),
      'Batch Tokyo minggu ini.',
      false,
      now() + interval '14 days',
      v_owner_user_id,
      now() - interval '2 days'
    )
  on conflict (id) do update set
    items = excluded.items,
    message = excluded.message,
    is_permanent = excluded.is_permanent,
    expires_at = excluded.expires_at,
    created_by = excluded.created_by;

  insert into orders (
    id, store_id, status, subtotal, delivery_price, promo_discount, total,
    recipient_name, phone, street, city, province, postal_code, notes,
    courier_id, courier_name, courier_code, service_name, service_type,
    estimated_days, tracking_number, biteship_order_id,
    payment_method, midtrans_token, midtrans_redirect_url,
    proof_url, proof_submitted_at, is_archived, created_at, updated_at
  )
  values
    (
      v_order_pending_id, v_store_id, 'pending', 425000, 25000, 0, 450000,
      'Rina Wijaya', '081200000001', 'Jl. Melati No. 1', 'Jakarta Selatan', 'DKI Jakarta', '12560',
      'Tolong kirim sore hari.', 'demo-flat', 'Flat Rate', 'flat', 'Same-day Jakarta', 'same_day',
      1, null, null, 'bank_transfer', null, null, null, null, false,
      now() - interval '3 hours', now() - interval '3 hours'
    ),
    (
      v_order_paid_id, v_store_id, 'paid', 749000, 25000, 74900, 699100,
      'Dimas Pratama', '081200000002', 'Jl. Mangga No. 22', 'Bekasi', 'Jawa Barat', '17111',
      null, 'jne-reg', 'JNE', 'jne', 'REG', 'regular',
      2, null, null, 'midtrans', 'demo-midtrans-token-paid', 'https://app.midtrans.com/snap/demo-paid',
      null, null, false, now() - interval '1 day', now() - interval '1 day'
    ),
    (
      v_order_processing_id, v_store_id, 'processing', 1250000, 38000, 0, 1288000,
      'Maya Lestari', '081200000003', 'Jl. Cemara No. 8', 'Bandung', 'Jawa Barat', '40115',
      'Ukuran EU 41.', 'sicepat-reg', 'SiCepat', 'sicepat', 'REG', 'regular',
      2, null, null, 'midtrans', 'demo-midtrans-token-processing', 'https://app.midtrans.com/snap/demo-processing',
      null, null, false, now() - interval '2 days', now() - interval '1 day'
    ),
    (
      v_order_shipped_id, v_store_id, 'shipped', 1750000, 42000, 0, 1792000,
      'Andi Saputra', '081200000004', 'Jl. Kenanga No. 9', 'Surabaya', 'Jawa Timur', '60231',
      null, 'jnt-ez', 'J&T', 'jnt', 'EZ', 'regular',
      3, 'JT123456789DEMO', 'bite_demo_001', 'midtrans', 'demo-midtrans-token-shipped',
      'https://app.midtrans.com/snap/demo-shipped', null, null, false,
      now() - interval '5 days', now() - interval '2 days'
    ),
    (
      v_order_delivered_id, v_store_id, 'delivered', 790000, 35000, 0, 825000,
      'Sari Putri', '081200000005', 'Jl. Mawar No. 14', 'Denpasar', 'Bali', '80113',
      null, 'jne-reg', 'JNE', 'jne', 'REG', 'regular',
      4, 'JNE987654321DEMO', 'bite_demo_002', 'bank_transfer', null, null,
      'https://example.com/demo/payment-proof.jpg', now() - interval '9 days', false,
      now() - interval '12 days', now() - interval '7 days'
    ),
    (
      v_order_cancelled_id, v_store_id, 'cancelled', 325000, 25000, 0, 350000,
      'Budi Santoso', '081200000006', 'Jl. Anggrek No. 5', 'Tangerang', 'Banten', '15111',
      'Customer changed address after checkout.', 'demo-flat', 'Flat Rate', 'flat', 'Same-day Jakarta', 'same_day',
      1, null, null, 'bank_transfer', null, null, null, null, true,
      now() - interval '15 days', now() - interval '14 days'
    )
  on conflict (id) do update set
    status = excluded.status,
    subtotal = excluded.subtotal,
    delivery_price = excluded.delivery_price,
    promo_discount = excluded.promo_discount,
    total = excluded.total,
    recipient_name = excluded.recipient_name,
    phone = excluded.phone,
    street = excluded.street,
    city = excluded.city,
    province = excluded.province,
    postal_code = excluded.postal_code,
    notes = excluded.notes,
    courier_id = excluded.courier_id,
    courier_name = excluded.courier_name,
    courier_code = excluded.courier_code,
    service_name = excluded.service_name,
    service_type = excluded.service_type,
    estimated_days = excluded.estimated_days,
    tracking_number = excluded.tracking_number,
    biteship_order_id = excluded.biteship_order_id,
    payment_method = excluded.payment_method,
    midtrans_token = excluded.midtrans_token,
    midtrans_redirect_url = excluded.midtrans_redirect_url,
    proof_url = excluded.proof_url,
    proof_submitted_at = excluded.proof_submitted_at,
    is_archived = excluded.is_archived,
    updated_at = now();

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_pending_id, v_product_skincare_id, 'Skincare Korea Starter Set - Normal Skin', 425000, 1, 'DEMO-SKIN-001-NOR'
  where not exists (select 1 from order_items where order_id = v_order_pending_id and sku = 'DEMO-SKIN-001-NOR');

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_paid_id, v_product_bag_id, 'Tas Kulit Korea Premium - Coklat', 749000, 1, 'DEMO-BAG-001-BRN'
  where not exists (select 1 from order_items where order_id = v_order_paid_id and sku = 'DEMO-BAG-001-BRN');

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_processing_id, v_product_sneaker_id, 'Sneakers Japan Limited - EU 41', 1250000, 1, 'DEMO-SHOE-001-41'
  where not exists (select 1 from order_items where order_id = v_order_processing_id and sku = 'DEMO-SHOE-001-41');

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_shipped_id, v_product_watch_id, 'Jam Tangan Minimal Swiss', 1750000, 1, 'DEMO-WATCH-001'
  where not exists (select 1 from order_items where order_id = v_order_shipped_id and sku = 'DEMO-WATCH-001');

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_delivered_id, v_product_bag_id, 'Tas Kulit Korea Premium - Hitam', 749000, 1, 'DEMO-BAG-001-BLK'
  where not exists (select 1 from order_items where order_id = v_order_delivered_id and sku = 'DEMO-BAG-001-BLK');

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_delivered_id, v_product_chocolate_id, 'Chocolate Gift Box EU', 325000, 1, 'DEMO-CHOCO-001'
  where not exists (select 1 from order_items where order_id = v_order_delivered_id and sku = 'DEMO-CHOCO-001');

  insert into order_items (order_id, product_id, product_name, price, quantity, sku)
  select v_order_cancelled_id, v_product_chocolate_id, 'Chocolate Gift Box EU', 325000, 1, 'DEMO-CHOCO-001'
  where not exists (select 1 from order_items where order_id = v_order_cancelled_id and sku = 'DEMO-CHOCO-001');

  insert into order_promo_codes (order_id, promo_code_id, code, discount_amount)
  select v_order_paid_id, v_promo_welcome_id, 'DEMO10', 74900
  where not exists (
    select 1 from order_promo_codes
    where order_id = v_order_paid_id and promo_code_id = v_promo_welcome_id
  );

  insert into order_attachments (order_id, file_path, file_name, mime_type)
  select v_order_delivered_id, v_order_delivered_id::text || '/demo-payment-proof.jpg', 'demo-payment-proof.jpg', 'image/jpeg'
  where not exists (
    select 1 from order_attachments
    where order_id = v_order_delivered_id and file_name = 'demo-payment-proof.jpg'
  );

  insert into notification_preferences (user_id, store_id, topic, push_enabled, email_enabled)
  values
    (v_owner_user_id, v_store_id, 'order_status', true, true),
    (v_owner_user_id, v_store_id, 'low_stock', true, true),
    (v_owner_user_id, v_store_id, 'bank_transfer_proof', true, true)
  on conflict (user_id, store_id, topic) do update set
    push_enabled = excluded.push_enabled,
    email_enabled = excluded.email_enabled,
    updated_at = now();

  insert into store_notifications (store_id, user_id, type, title, body, metadata, read_at, created_at)
  select v_store_id, v_owner_user_id, 'order_status', 'Pesanan demo dibayar',
         'Pesanan DEMO10 sudah masuk dan siap diproses.',
         jsonb_build_object('orderId', v_order_paid_id), null, now() - interval '1 day'
  where not exists (
    select 1 from store_notifications
    where store_id = v_store_id and user_id = v_owner_user_id and metadata ->> 'orderId' = v_order_paid_id::text
  );

  insert into store_notifications (store_id, user_id, type, title, body, metadata, read_at, created_at)
  select v_store_id, v_owner_user_id, 'low_stock', 'Stok produk rendah',
         'Jam Tangan Minimal Swiss tersisa 3 item.',
         jsonb_build_object('productId', v_product_watch_id), now() - interval '6 hours', now() - interval '6 hours'
  where not exists (
    select 1 from store_notifications
    where store_id = v_store_id and user_id = v_owner_user_id and metadata ->> 'productId' = v_product_watch_id::text
  );

  if to_regclass('public.analytics_pageviews') is not null then
    execute $sql$
      insert into analytics_pageviews (
        session_id, user_id, path, referrer_path, store_id, duration_ms, user_agent, created_at
      )
      select 'demo-session-001', null, '/store/demo', null, $1, 48000, 'Demo Browser', now() - interval '2 days'
      where not exists (
        select 1 from analytics_pageviews
        where session_id = 'demo-session-001' and path = '/store/demo'
      )
    $sql$ using v_store_id;
  end if;

  if to_regclass('public.analytics_events') is not null then
    execute $sql$
      insert into analytics_events (session_id, user_id, event_name, properties, path, store_id, created_at)
      select 'demo-session-001', null, 'product_view',
             jsonb_build_object('productId', $1, 'source', 'demo'),
             '/store/demo/products/tas-kulit-korea-premium', $2, now() - interval '2 days'
      where not exists (
        select 1 from analytics_events
        where session_id = 'demo-session-001' and event_name = 'product_view'
      )
    $sql$ using v_product_bag_id, v_store_id;
  end if;
end $$;
