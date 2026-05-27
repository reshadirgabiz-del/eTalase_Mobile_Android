## About this document
This document lists features that the Jastip Platform has, unreleased, and under development. This is a task list that should be treated like a Kanban board.

## Released features
- Stock management
- Store members
- Personal payment portals
- Subscriptions & billing (Starter / Growth / Business / Enterprise plans, enforced server-side)
- Image upload for products and store settings
- Auth page restyling (Clerk appearance matching dashboard colors)
- Member invitation via email (token-based flow, `/invite/accept` route)
- Multi-store / multi-user support (storeId-scoped API, role-based access)
- Order link with a custom message / note: merchants can add a short greeting or context message (up to 300 chars) that appears on the link landing page. Restricted to starter+ subscription.
- Reusable / no-expiry links: merchants can create permanent order links that never expire and can be manually revoked at any time. Restricted to starter+ subscription.
- Import products from Excel template: merchants can download a pre-filled template, fill it in, and upload it to bulk-create products. Available at `/dashboard/[storeId]/products`. Restricted to starter+ subscription.
  - Backend: `GET /products/import/template`, `POST /products/import` (multipart, field `file`).
  - DB migration: `supabase/migrations/20260522_order_links_message_permanent.sql` — adds `message` and `is_permanent` columns to `order_links`, makes `expires_at` nullable.
- Mobile app for store members: depending on the role, in the mobile app: (1) Delivery person can look into order list, upload photos, and changing status to delivered; (2) Admin person can do everything Delivery person can, plus managing stocks and products, look at the storefront from dashboard, and manage order links; (3) Owner can do all Admin person can do similar to webapp, except exporting reports. These access level should also be reflected in the webapp, except exporting reports which available to everyone depending on the access level.

## Developed, unreleased features (uncommitted)
- Pre-build orders with items from a link: Merchant creates a shareable link from the dashboard (`/dashboard/[storeId]/order-links`) by selecting products and quantities. Customer opens `/{storeId}/order-link/{linkId}`, sees a basket preview, clicks "Beli Sekarang" to pre-populate their cart and proceed through the store-specific checkout (`/{storeId}/checkout`). Links expire after 2 hours.
  - Backend: `POST /order-links`, `GET /order-links/:id/public`, `GET /order-links`, `DELETE /order-links/:id` in new `OrderLinksModule`.
  - DB migration: `supabase/migrations/20260521_add_order_links.sql` — must be run in Supabase SQL Editor before this feature works.

## Developed, unreleased features (uncommitted) — additions

- Customer order tracking page: public page at `/track` where customers enter order ID + phone number (last 8 digits) to view status timeline, courier, tracking number, recipient, items, and total. Accessible from storefront header (package icon).
  - Backend: public `GET /orders/track?orderId=:id&phone=:phone` in `OrdersModule` (no auth).
- Merchant shipping label PDF: A6 print-ready label generated from the order detail drawer. Standalone route at `/shipping-label/[storeId]/[orderId]` opens in new tab, auto-triggers print dialog. Template includes "Our Jastip Live" brand mark, store logo & name, courier + tracking, sender (origin address from settings), recipient block, item list with quantities, and order ID footer. Auth-gated via Clerk.
- Theme-aware alerts: `Notification` and `Alert` defaults added to `Frontend/src/styles/theme.ts` — radius 0, brand border color, DM Sans font, semantic colors (green/red/yellow) preserved.
- Mobile app and email notifications on order status changes, shipment status changes, and low stock alerts:
  - Push notifications via Expo Push API sent to all store members with registered tokens.
  - Email alerts sent to store owners and admins (role: owner/admin, invitation_status: accepted).
  - Stock alert triggers when product stock is updated to ≤ 5 items (or 0 for "out of stock").
  - Backend: `POST /notifications/token` (register device), `DELETE /notifications/token` (unregister) in new `NotificationsModule`.
  - DB migration: `supabase/migrations/20260525_add_push_tokens.sql` — creates `push_tokens` table.
  - Mobile: `expo-notifications` added; token registered on store selection in `store-select.tsx`; unregistered on sign-out.
  - Mobile: tapping an order-status notification navigates to the orders screen; tapping a low-stock notification navigates to the products screen (`NotificationTapHandler` in `_layout.tsx`).
  - Mobile: push token persisted in `appStore` for reliable unregistration on sign-out.
- Promo code on checkout: customers enter one or more promo codes at the checkout payment step for discounts on the total, product subtotal, or delivery fee (% or absolute). Merchants create and manage codes at `/dashboard/[storeId]/promo-codes` (owner and admin only; web only). Each code supports: product scope (all or specific products), expiry date (default: unlimited), max usage count (default: unlimited). Usage is recorded in `order_promo_codes` and tracked via `totalSaved` and `currentUsages` per code. When the total reaches 0 (fully covered by discount), the order is marked `paid` immediately with no Midtrans redirect.
  - Backend: `POST /promo-codes`, `GET /promo-codes`, `GET /promo-codes/:id`, `PATCH /promo-codes/:id`, `DELETE /promo-codes/:id` (auth, owner/admin), `POST /promo-codes/validate` (public) in new `PromoCodesModule`. `CreateOrderDto` extended with optional `promoCodes: string[]`.
  - DB migration: `supabase/migrations/20260526_add_promo_codes.sql` — adds `promo_codes`, `order_promo_codes` tables, and `promo_discount` column to `orders`.
- Allow payment with direct transfer, as an alternative to Midtrans. The merchant can put in (1) Text; (2) Bank details, i.e. No. Rek, Nama penerima, Nama bank; (3) Once a transfer made, customer can upload proof of transfer and notify the merchant via chat (e.g., WhatsApp). The platform notify merchant via mobile notification; (4) The proof of transfer will be attached to the order item, order status need to be confirmed by admin/owner. The mobile notification has confirm/ignore option to quickly confirm the payment; (5) Once confirmed, the status will change to "Paid"
- Promo code usage is tracked in the order item. Opening the order will show merchant which promo being used in the order.
- Allow merchant to make a flat-rate delivery.
- On the storefront, add a button to open a modal called "About the merchant" (Tentang kami). This will give the logo of the merchant, description, address, and contacts. In the settings, also allow merchant to add links to social media. These links will show up in the About the merchant modal for the customer to contact the merchant.
- For pages that is reserved for members (like purchase a plan), redirect the user to sign-in page when he/she has not been logged-in. When login succeed, redirect to the page he/she originally wants to open.
- Allow payment in different currencies. Currency is set in Settings → Pembayaran tab. Non-IDR disables Midtrans and auto-enables bank transfer. Currency display is now consistent across the dashboard (orders, products, overview, promo-codes, order-links), storefront, and mobile app.
  - Dashboard: `StoreRoleContext` now carries `currency`; layout fetches it from public settings. All price-formatting calls use `formatPrice(amount, currency)`.
  - Mobile: `appStore` now persists `currency`; fetched from `/settings/public` on store select; `formatPrice` added to `lib/api.ts`.
  - DB migration: `supabase/migrations/20260530_new_settings_fields.sql` — already covers `currency` column in `settings`.
- Notification preferences (email & push per topic): each user can independently enable/disable push notifications per topic (order_status, low_stock, bank_transfer_proof). Email prefs work the same way. Preferences are per-user per-store.
  - Backend: `GET /notifications/preferences?storeId=X` and `PATCH /notifications/preferences` in `NotificationsController`. Push/email dispatch respects per-user topic preferences.
  - Dashboard Settings: new **Notifikasi** tab (4th tab in the tabbed settings page) with push+email switches per topic.
  - Mobile: new **Notifikasi Push** card on the Profile screen with per-topic toggles.
  - DB migration: `supabase/migrations/20260527_notification_preferences.sql` — creates `notification_preferences` table.
- Settings page grouped with tabs: Dashboard settings page now has 4 tabs — **Toko** (info + social links), **Pembayaran** (currency, Midtrans, bank transfer), **Pengiriman** (flat rate, origin address, couriers), **Notifikasi**. The sidebar navbar shows a ToC sub-list when on the settings page (Toko / Pembayaran / Pengiriman / Notifikasi) as anchor links using `?tab=` query params.

## Features under development
<!-- (none currently) -->

## Feature ideas (not yet scoped)
- Order link analytics: track how many times a link was opened and converted to a completed order, surfaced in the dashboard.
- Export orders to CSV / Excel: downloadable report from the orders dashboard, scoped by date range and status.