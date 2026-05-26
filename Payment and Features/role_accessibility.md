## About this document
Summary of the three member roles on the Jastip Platform and which features each role can access across the web dashboard and mobile app.

---

## Roles

### Owner
The account holder who owns the subscription. Has full access everywhere. Only role that can manage store members and change store settings.

### Admin
A trusted team member with near-full access. Can manage products, stocks, orders, order links, and promo codes, but cannot manage other members or touch billing/settings.

### Delivery
A field team member focused on order fulfillment. Can view orders, update delivery status, and upload proof-of-delivery photos. No access to product management or promo features.

---

## Web Dashboard — Feature Access by Role

| Feature | Owner | Admin | Delivery |
|---|---|---|---|
| Overview (dashboard home) | ✅ | ✅ | — |
| Products (create, edit, delete) | ✅ | ✅ | Read-only |
| Stocks (adjust stock levels) | ✅ | ✅ | Read-only |
| Orders (list, view, change status) | ✅ | ✅ | ✅ |
| Shipments (tracking & courier info) | ✅ | ✅ | ✅ |
| Order Links (create, manage, delete) | ✅ | ✅ | — |
| Promo Codes (create, toggle, delete) | ✅ | ✅ | — |
| Members (invite, remove) | ✅ | — | — |
| Store Settings (Midtrans, address, couriers) | ✅ | — | — |
| Billing & Subscription | ✅ | — | — |
| Shipping Label PDF (print) | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ✅ | ✅ |

> **Note:** "Export Reports" is available to all roles on the web, but not on the mobile app.

---

## Mobile App — Feature Access by Role

| Feature | Owner | Admin | Delivery |
|---|---|---|---|
| Order list (view) | ✅ | ✅ | ✅ |
| Order status change | ✅ | ✅ | Delivered only |
| Upload proof-of-delivery photos | ✅ | ✅ | ✅ |
| Products (view, manage) | ✅ | ✅ | Read-only |
| Stock management | ✅ | ✅ | — |
| Order Links (view, manage) | ✅ | ✅ | — |
| Storefront preview | ✅ | ✅ | — |
| Promo Codes | — (web only) | — (web only) | — |
| Export Reports | — | — | — |
| Push notifications (order status, low stock) | ✅ | ✅ | ✅ (order status only) |

> **Creating promo codes** is web-only for all roles. The mobile app does not expose a promo code management screen.

---

## Server-side Enforcement Summary

Role checks are enforced at the API layer (NestJS guards + service-level role lookups), not just the UI.

- **Owner-only endpoints:** member management (`/stores/:id/members` POST/DELETE), store settings PATCH, subscription checkout.
- **Owner + Admin:** promo code CRUD (`/promo-codes`), order link create/delete, product create/edit/delete, stock adjustments.
- **All roles:** order list/view, order status update (delivery role limited to `delivered`), attachment upload.
- **Public (no auth):** storefront pages, checkout, order tracking (`/track`), order link public view, promo code validation (`/promo-codes/validate`).
