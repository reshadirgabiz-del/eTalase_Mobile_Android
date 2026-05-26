# Jastip Platform — QA Test Procedure

**Version:** 2026-05-25  
**Scope:** Full app readiness check — authentication, onboarding, subscription, store management, storefront, checkout, and mobile

---

## Prerequisites

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`
- Midtrans sandbox credentials configured
- Supabase project connected with all migrations applied
- At least one test Clerk account (use a personal email you can access)

---

## 1. Authentication

| # | Action | Expected |
|---|---|---|
| 1.1 | Visit `/sign-up`, register with email+password | Redirected to `/dashboard` after verification |
| 1.2 | Sign out, then visit a protected route (e.g. `/dashboard`) | Redirected to `/sign-in` |
| 1.3 | Sign in with correct credentials | Redirected to `/dashboard` |
| 1.4 | Sign in with wrong password | Error message shown, no redirect |
| 1.5 | Visit `/dashboard` while signed out | Middleware redirects to `/sign-in` |

---

## 2. Onboarding

| # | Action | Expected |
|---|---|---|
| 2.1 | First sign-in with a fresh account | Onboarding modal appears |
| 2.2 | Complete onboarding steps (store name, logo, origin address) | Modal closes, store created, redirected to store dashboard |
| 2.3 | Refresh page after onboarding | Modal does NOT re-appear |
| 2.4 | Try to skip onboarding (close modal) | Blocked — modal cannot be dismissed without completing steps |

---

## 3. Subscription & Billing

| # | Action | Expected |
|---|---|---|
| 3.1 | Navigate to `/dashboard/billing` with no subscription | "Belum ada langganan aktif" shown; plan cards listed |
| 3.2 | Click "Pilih Paket Ini" on any non-enterprise plan | Midtrans Snap popup opens |
| 3.3 | Complete payment in Midtrans sandbox (use card `4811 1111 1111 1114`) | Subscription becomes **Aktif**; expiry date shown |
| 3.4 | Navigate to billing page with active subscription | Current plan card shows "Paket Aktif" badge; cancel button visible |
| 3.5 | Click "Batalkan Langganan" | Confirmation modal opens |
| 3.6 | Click "Kembali" in the modal | Modal closes; subscription unchanged |
| 3.7 | Click "Ya, Batalkan Langganan" | Subscription status changes to **Dibatalkan**; product stocks set to 0; cancel button disappears |
| 3.8 | Subscribe to a higher plan while already on active plan | Previous plan is cancelled; new plan activated |
| 3.9 | Try to create a store without active subscription | Error 402 returned; UI shows upgrade prompt |
| 3.10 | Let subscription expire (set `expires_at` to past in DB for testing) | On next relevant action, status transitions to **Kedaluwarsa** |

---

## 4. Store Management

| # | Action | Expected |
|---|---|---|
| 4.1 | Create a new store (requires active subscription) | Store appears in store selector |
| 4.2 | Try to exceed max stores for plan (e.g. Starter = 1 store) | Error 402 with plan limit message |
| 4.3 | Navigate to store dashboard | Overview page loads with order chart and revenue stats |
| 4.4 | Edit store name and logo via Settings (`/dashboard/[storeId]/settings`) | Changes reflected in store selector and storefront header |
| 4.5 | Set origin address (required for delivery estimation) | Address saved; delivery rates work in storefront checkout |

---

## 5. Products

| # | Action | Expected |
|---|---|---|
| 5.1 | Add a product with name, price, image, and stock | Product appears in product list |
| 5.2 | Try to add product without active subscription | Error 402 |
| 5.3 | Try to exceed max products per store for plan | Error 402 with plan limit message |
| 5.4 | Edit product price | Price updated; storefront reflects change immediately |
| 5.5 | Set product stock to 0 | Product shows as out-of-stock in storefront |
| 5.6 | Delete a product | Product removed from list and storefront |

---

## 6. Storefront (Customer View)

| # | Action | Expected |
|---|---|---|
| 6.1 | Visit `/{storeId}` (public URL) | Storefront loads with store logo, name, and product listing |
| 6.2 | Add a product to cart | Cart drawer opens; item and quantity shown |
| 6.3 | Add multiple products, change quantities | Cart totals update correctly |
| 6.4 | Remove item from cart | Item disappears; total recalculated |
| 6.5 | Proceed to checkout | Stepper starts at Cart Review |

---

## 7. Checkout Flow

| # | Action | Expected |
|---|---|---|
| 7.1 | Cart Review step — verify items and prices match storefront | No discrepancies |
| 7.2 | Enter delivery address (use Google Places autocomplete) | Address validated; next step unlocked |
| 7.3 | Delivery Picker step — rates loaded from Biteship | Courier options with price and ETA shown |
| 7.4 | Select a courier | Selection highlighted; next step unlocked |
| 7.5 | Apply valid promo code (create one in dashboard first) | Discount applied to total |
| 7.6 | Apply expired or invalid promo code | Error message; total unchanged |
| 7.7 | Payment Summary — verify total = subtotal + delivery − discount | Math correct |
| 7.8 | Submit order | Order created; Midtrans Snap opens |
| 7.9 | Complete payment (sandbox card) | Order status → **paid** in dashboard |
| 7.10 | Attempt checkout when store has no origin address set | Error shown: "Alamat asal toko belum dikonfigurasi" |

---

## 8. Order Management (Dashboard)

| # | Action | Expected |
|---|---|---|
| 8.1 | View order list in dashboard | All orders listed with status badges |
| 8.2 | Open an order — verify items, address, delivery, total | Data matches what customer submitted |
| 8.3 | Advance order through status: `paid → processing → shipped → delivered` | Each transition saves correctly; badge updates |
| 8.4 | Try an invalid transition (e.g. `pending → delivered`) | Error 400 |
| 8.5 | Cancel any order from any non-terminal state | Order moves to **Dibatalkan** |
| 8.6 | Upload an attachment to an order (e.g. receipt photo) | File stored; signed URL returned for preview |
| 8.7 | Filter orders by status | Only matching orders shown |

---

## 9. Order Links

| # | Action | Expected |
|---|---|---|
| 9.1 | Create a one-time order link for selected products | Link generated; copyable URL shown |
| 9.2 | Open order link URL in a private/incognito browser | Pre-filled cart with linked products shown |
| 9.3 | Complete checkout via the order link | Order created and tied to the link |
| 9.4 | Try to reuse a one-time link after an order was placed | Link expired or shows empty state |
| 9.5 | Create a permanent order link (requires Growth+ plan) | Link persists across multiple orders |
| 9.6 | Try to create permanent link on Starter plan | Error 402 with upgrade prompt |

---

## 10. Promo Codes

| # | Action | Expected |
|---|---|---|
| 10.1 | Create a percentage discount promo code | Code saved; appears in promo list |
| 10.2 | Create a fixed-amount promo code with an expiry date | Code saved with expiry |
| 10.3 | Apply active code in storefront checkout | Discount calculated correctly |
| 10.4 | Apply expired code | Error: code expired |
| 10.5 | Apply code from a different store | Error: code not found |
| 10.6 | Try to exceed promo code limit for plan | Error 402 |

---

## 11. Team Members

| # | Action | Expected |
|---|---|---|
| 11.1 | Invite a member by email (must be a registered Clerk user) | Invite email sent; pending invite shown |
| 11.2 | Accept invite via `/invite/accept` link | Member added to store with correct role |
| 11.3 | Invite same email twice | Error: already a member or invite pending |
| 11.4 | Try to exceed member limit for plan | Error 402 |
| 11.5 | Remove a member | Member removed from store; cannot access dashboard |
| 11.6 | Transfer ownership to another member | New owner can access all owner-only actions; old owner is downgraded |

---

## 12. Order Tracking (Public)

| # | Action | Expected |
|---|---|---|
| 12.1 | Visit `/track` and enter a valid order ID | Order status and timeline shown |
| 12.2 | Enter an invalid or non-existent order ID | "Order tidak ditemukan" message |

---

## 13. Shipping Label

| # | Action | Expected |
|---|---|---|
| 13.1 | Visit `/shipping-label/[storeId]/[orderId]` for a paid order | Printable label renders with recipient address, items, and store logo |
| 13.2 | Visit label URL for an order from a different store | Access denied or 404 |

---

## 14. Account Management

| # | Action | Expected |
|---|---|---|
| 14.1 | Update display name/avatar via `/dashboard/account` | Profile updated in Clerk and reflected in UI |
| 14.2 | Try to delete account while owning a store | Error: "Transfer kepemilikan atau hapus semua toko sebelum menghapus akun" |
| 14.3 | Delete all owned stores, then delete account | Account deleted; session invalidated; redirected to sign-in |

---

## 15. Mobile App (Expo)

| # | Action | Expected |
|---|---|---|
| 15.1 | Launch app — sign in | Auth succeeds; home screen loads |
| 15.2 | Select a store | Store-specific order list shown |
| 15.3 | View an order on mobile | Order details rendered with status badge |
| 15.4 | Push notification received when order status changes | Notification appears on device |

---

## 16. Edge Cases & Regression

| # | Scenario | Expected |
|---|---|---|
| 16.1 | Place order while product stock is 0 | Order blocked; error shown to customer |
| 16.2 | Two customers check out the same last-stock item simultaneously | Only one succeeds; other gets stock error |
| 16.3 | Midtrans webhook arrives with missing `signature_key` | Rejected; subscription NOT activated |
| 16.4 | Backend returns 402 for any feature action after subscription cancels | Frontend shows upgrade/billing redirect, not a generic error |
| 16.5 | Store origin address not set; customer tries to get delivery rates | Friendly error shown: configure store address first |
| 16.6 | Invite a non-existent email (not in Clerk) | Invite stored as pending-by-email; no crash |

---

## Known Gaps / Not Yet Implemented

| Area | Status |
|---|---|
| Rate limiting on `POST /orders` (public endpoint) | Missing — risk of spam before launch |
| Fully atomic ownership transfer (requires DB transaction / RPC) | Best-effort only; edge case if DB fails mid-transfer |
| Email notifications for order status changes | Not confirmed — verify with email service setup |
| Mobile: full checkout flow | Verify scope — mobile may be view-only |
