## About this document

This document defines the current e-Talase pricing and entitlement model used by the frontend and backend.

## Pricing model

Plans are assigned per store, not per user account. Every new store starts on Free. A Lifetime purchase upgrades exactly one selected store and never expires. An owner may purchase Lifetime separately for multiple stores.

Stores that existed when this pricing model was introduced are migrated automatically to Lifetime. Stores created afterward use Free by default.

## Plans

### Free — IDR 0, default

- One Free store slot per owner. Each Lifetime store adds capacity for the owner to create the next Free store.
- One member: owner only.
- Five active products per store, without categorization.
- Unlimited transactions with an IDR 1,000 admin fee per transaction.
- Ten active temporary order links with a two-hour expiry.
- No permanent order links or personal order-link message.
- Manual product entry only; no Excel import.
- Three promo codes per store, limited to one product per code.
- One shipment-origin location.
- Customer order tracking and shipping-label PDF.
- No mobile-app access or push/email notifications.

### Lifetime — IDR 300,000 once per store

- Applies permanently to one selected store; no renewal or expiry.
- Owners can purchase Lifetime multiple times for different stores.
- Five members total: owner plus four additional members.
- 100 active products per store, with categorization.
- Unlimited transactions with no admin fee.
- Unlimited active temporary order links.
- 100 permanent order links per store, with personal messages.
- Excel product import.
- 100 promo codes per store, with multiple products allowed per code.
- Three shipment-origin locations.
- Storefront customization, SDK, custom-domain and API access.
- Customer order tracking and shipping-label PDF.
- Mobile-app access for product, stock and transaction management.
- Push and email notifications.
- Priority merchant support, setup support and early feature access.

## Feature matrix

| Feature | Free | Lifetime |
|---|---:|---:|
| Price | IDR 0 | IDR 300,000 once per store |
| Expiry | Never | Never |
| Store scope | Default Free store | One purchased store |
| Members including owner | 1 | 5 |
| Products per store | 5 | 100 |
| Product categorization | No | Yes |
| Transaction fee | IDR 1,000/order | None |
| Active temporary order links | 10 | Unlimited |
| Permanent order links | 0 | 100 |
| Order-link personal message | No | Yes |
| Product import | No | Yes |
| Promo codes | 3, one product each | 100, multiple products |
| Shipment-origin locations | 1 | 3 |
| Storefront customization/API | No | Yes |
| Mobile app | No | Yes |
| Push and email notifications | No | Yes |

## Enforcement rules

- `subscriptions.store_id` identifies the single store receiving a Lifetime entitlement.
- Checkout requires an owned `storeId`; purchasing Lifetime for an already-Lifetime store is rejected.
- Backend limits and feature flags resolve from the target store, never from another store owned by the same user.
- A user may hold multiple active Lifetime purchases as long as each purchase targets a different store.
- Existing stores are backfilled with a non-expiring Lifetime entitlement by the deployment migration.
