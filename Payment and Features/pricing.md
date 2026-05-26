## About this document
This document lies the pricing method for Jastip Platform that will be implemented in the apps.

## Pricing tiers

- Starter (IDR 150k / bulan)
>> 1 store
>> 2 total members (owner + 1 additional)
>> 10 products per store, no categorization
>> Unlimited transactions
>> Unlimited temporary order links (2-hour expiry)
>> No permanent order links
>> No order link personal message
>> Bulk product import via Excel template
>> 10 promo codes per store (one product per code, owner/admin only)
>> Customer order tracking page (public)
>> Shipping label PDF (auth-gated)
>> Mobile app: stock & transaction management
>> Push & email notifications (order status, low stock)
>> Limited support

- Growth (IDR 300k / bulan, recommended)
>> 3 stores
>> 5 total members (owner + 4 additional)
>> 50 products per store, with categorization
>> Unlimited transactions
>> Unlimited temporary order links + 5 permanent order links with personal message
>> Bulk product import via Excel template
>> 25 promo codes per store (multiple products per code, owner/admin only)
>> Customer order tracking page (public)
>> Shipping label PDF (auth-gated)
>> Mobile app: product, stock & transaction management
>> Push & email notifications (order status, low stock)
>> Priority support
>> Setup support
>> Priority access to new feature releases

- Business (IDR 1000k / bulan)
>> 10 stores
>> 26 total members (owner + 25; additional at a fee)
>> 200 products per store, with categorization
>> Unlimited transactions
>> Unlimited temporary order links + 25 permanent order links with personal message
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

| Feature | Starter | Growth | Business | Enterprise |
|---|---|---|---|---|
| Stores | 1 | 3 | 10 | Unlimited |
| Members (incl. owner) | 2 | 5 | 26 | Unlimited |
| Products per store | 10 | 50 | 200 | Unlimited |
| Product categorization | No | Yes | Yes | Yes |
| Temporary order links | Unlimited | Unlimited | Unlimited | Unlimited |
| Permanent order links | 0 | 5 | 25 | Unlimited |
| Order link personal message | No | Yes | Yes | Yes |
| Bulk product import (Excel) | Yes | Yes | Yes | Yes |
| Promo codes | 10, one product each | 25, multiple product allowed | Unlimited | Unlimited | (updated)
| Customer order tracking | Yes | Yes | Yes | Yes |
| Shipping label PDF | Yes | Yes | Yes | Yes |
| Storefront customization | No | No | 1 (paid extra) | Unlimited |
| Analytics dashboard | No | No | Yes | Yes |
| Jastip API access | No | No | No | Yes |
| Mobile app | Yes | Yes | Yes | Yes |
| Push & email notifications | Yes | Yes | Yes | Yes |

## Role-based quantity restrictions (server-enforced)

All limits below are enforced server-side via the subscriptions service. Clients cannot bypass them.

- **maxStores**: how many stores an owner can create under one subscription
- **maxProductsPerStore**: products limit per individual store
- **maxMembersPerStore**: total member count including the owner
- **maxPermanentOrderLinks**: permanent (non-expiring) links per store; 0 = disabled
- **maxPromoCodes**: max active promo codes per store (Starter: 10, Growth: 25, Business/Enterprise: unlimited)
- **hasMultiProductPromo**: whether a single promo code can target more than one specific product (false on Starter, true on Growth+)
