  -- ============================================================
  -- Clean wipe — removes all data, preserves schema
  -- Safe to run before pushing to production.
  -- RESTART IDENTITY resets sequences; CASCADE handles FK order.
  -- ============================================================

  TRUNCATE TABLE
    -- Credits / billing
    credit_refund_requests,
    credit_topup_requests,
    credit_transactions,
    account_credits,

    -- Subscriptions / plans
    subscriptions,
    plan_vouchers,
    plan_prices,
    plan_configs,

    -- Orders
    order_attachments,
    order_items,
    order_promo_codes,
    order_links,
    orders,

    -- Products
    product_images,
    product_variants,
    products,

    -- Promotions
    promo_codes,

    -- Notifications / tokens
    store_notifications,
    notification_preferences,
    push_tokens,
    admin_push_tokens,

    -- Misc
    r2_cleanup_queue,

    -- Core (last — parents of most FKs)
    settings,
    store_members,
    stores

  RESTART IDENTITY CASCADE;