## About this document
This document lies the pricing method for Jastip Platform that will be implemented in the apps.

## Pricing tiers

- Free (IDR 0 / selamanya)
>> 1 store
>> 1 member only (owner only, no additional team members)
>> 5 products per store, no categorization
>> Unlimited transactions, with admin fee per transaction (IDR 1k)
>> 10 temporary order links (2-hour expiry)
>> No permanent order links
>> No order link personal message
>> Manual product entry only (no Excel import)
>> 3 promo codes per store (one product per code)
>> Customer order tracking page (public)
>> Shipping label PDF (auth-gated)
>> No mobile app
>> No push & email notifications

- Starter (IDR 150k / bulan)
>> 1 store
>> 2 total members (owner + 1 additional)
>> 15 products per store, with categorization
>> Unlimited transactions, no admin fee
>> Unlimited temporary order links (2-hour expiry)
>> 10 permanent order links
>> No order link personal message
>> Bulk product import via Excel template
>> 10 promo codes per store (one product per code, owner/admin only)
>> Customer order tracking page (public)
>> Shipping label PDF (auth-gated)
>> Mobile app: stock & transaction management (not available on Free)
>> Push & email notifications: order status, low stock (not available on Free)
>> Merchant support

- Growth (IDR 300k / bulan, recommended)
>> 3 stores
>> 5 total members (owner + 4 additional)
>> 50 products per store, with categorization
>> Unlimited transactions
>> Unlimited temporary order links + 50 permanent order links with personal message
>> Bulk product import via Excel template
>> 25 promo codes per store (multiple products per code, owner/admin only)
>> Customer order tracking page (public)
>> Shipping label PDF (auth-gated)
>> Mobile app: product, stock & transaction management
>> Push & email notifications (order status, low stock)
>> Priority merchant support
>> Setup support
>> Priority access to new feature releases

- Business (IDR 1000k / bulan)
>> 10 stores
>> 26 total members (owner + 25; additional at a fee)
>> 200 products per store, with categorization
>> Unlimited transactions
>> Unlimited temporary order links + 100 permanent order links with personal message
>> Bulk product import via Excel template
>> Unlimited promo codes (multiple products per code, owner/admin only)
>> Customer order tracking page (public)
>> Shipping label PDF (auth-gated)
>> 1 storefront customization (additional at a fee)
>> Analytics dashboard (order link performance, promo code usage)
>> Mobile app: product, stock & transaction management
>> Push & email notifications (order status, low stock)
>> Priority support
>> Setup support

- Enterprise (Contact Us)
>> Everything in Business, but unlimited (stores, members, products, order links)
>> Storefront customization included
>> Analytics dashboard
>> Access to Jastip API
>> Dedicated support

## Feature availability matrix

| Feature | Free | Starter | Growth | Business | Enterprise |
|---|---|---|---|---|---|
| Stores | 1 | 1 | 3 | 10 | Unlimited |
| Members (incl. owner) | 1 | 2 | 5 | 26 | Unlimited |
| Products per store | 5 | 15 | 50 | 200 | Unlimited |
| Product categorization | No | Yes | Yes | Yes | Yes |
| Transaction fee | IDR 1k/tx | None | None | None | None |
| Temporary order links | 10 | Unlimited | Unlimited | Unlimited | Unlimited |
| Permanent order links | 0 | 10 | 50 | 100 | Unlimited |
| Order link personal message | No | No | Yes | Yes | Yes |
| Bulk product import (Excel) | No | Yes | Yes | Yes | Yes |
| Promo codes | 3, one product each | 10, one product each | 25, multiple product allowed | Unlimited | Unlimited |
| Customer order tracking | Yes | Yes | Yes | Yes | Yes |
| Shipping label PDF | Yes | Yes | Yes | Yes | Yes |
| Storefront customization | No | No | No | 1 (paid extra) | Unlimited |
| Analytics dashboard | No | No | No | Yes | Yes |
| Jastip API access | No | No | No | No | Yes |
| Mobile app | **No** | Yes | Yes | Yes | Yes |
| Push & email notifications | **No** | Yes | Yes | Yes | Yes |

## Role-based quantity restrictions (server-enforced)

All limits below are enforced server-side via the subscriptions service. Clients cannot bypass them.

- **maxStores**: how many stores an owner can create under one subscription
- **maxProductsPerStore**: products limit per individual store
- **maxMembersPerStore**: total member count including the owner
- **maxTemporaryOrderLinks**: active temporary links per store; null = unlimited (Free: 10, others: unlimited)
- **maxPermanentOrderLinks**: permanent (non-expiring) links per store; 0 = disabled
- **maxPromoCodes**: max active promo codes per store (Free: 3, Starter: 10, Growth: 25, Business/Enterprise: unlimited)
- **transactionFeeIdr**: per-transaction admin fee in IDR (Free: 1000, others: 0)
- **hasMultiProductPromo**: whether a single promo code can target more than one specific product (false on Free/Starter, true on Growth+)
- **hasMobileApp**: whether the user can log in and use the mobile app (false on Free, true on Starter+)
- **hasNotifications**: whether push & email notifications are sent (false on Free, true on Starter+)
- **hasProductImport**: whether bulk Excel import is available (false on Free, true on Starter+)
