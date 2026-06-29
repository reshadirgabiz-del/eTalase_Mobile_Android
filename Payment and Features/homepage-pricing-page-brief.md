# Homepage Pricing Page — Implementation Brief

## Objective

Create a public pricing page for e-Talase that clearly presents the two available plans: **Free** and **Lifetime**.

The page must communicate that plans apply per store. A user may own multiple Lifetime stores by purchasing Lifetime separately for each store.

## Current price

The current Lifetime price is:

```text
IDR 2,500,000 per store, one-time payment
```

Display it in Indonesian currency format as **Rp2.500.000**.

This price is temporary and will be adjusted in the future. Do not repeat or hardcode the numeric value throughout the page. Define it once in pricing data or configuration, for example:

```ts
const pricing = {
  lifetimePriceIdr: 2_500_000,
};
```

All visible price labels must derive from that single value. If the homepage consumes the plans API, use the API response as the source of truth instead.

## Plans

### Free

- Price: Rp0, free forever.
- Used automatically as the default for every new store.
- One member: owner only.
- Five active products per store.
- Ten active temporary order links with a two-hour expiry.
- No permanent order links.
- Three promo codes, limited to one product per code.
- Unlimited transactions with an Rp1.000 administration fee per transaction.
- One shipment-origin location.
- No product categorization, Excel import, mobile app, or push/email notifications.

Primary CTA: **Mulai Gratis**

### Lifetime

- Price: Rp2.500.000 as a one-time payment for one store.
- Never expires and has no recurring or renewal fee.
- Five members total: owner plus four additional members.
- 100 active products per store with categorization.
- Unlimited transactions without an administration fee.
- Unlimited temporary order links.
- 100 permanent order links with personal messages.
- 100 promo codes with multiple products allowed per code.
- Excel product import.
- Three shipment-origin locations.
- Storefront customization, SDK, custom-domain, and API access.
- Mobile app access.
- Push and email notifications.
- Priority merchant and setup support.

Primary CTA: **Beli Lifetime**

Supporting price copy: **Sekali bayar · Berlaku selamanya untuk 1 toko**

## Required messaging

Make these rules visible near the Lifetime price or CTA:

1. Lifetime applies to exactly one selected store.
2. Lifetime has no expiry and no recurring payment.
3. A separate purchase is required for every additional Lifetime store.
4. New stores use Free by default.

Do not use subscription wording such as “per month,” “per year,” “renewal,” or “billing cycle” for Lifetime.

## Page structure

Build the page in this order:

1. Hero section
   - Heading: **Harga sederhana untuk setiap tahap bisnis**
   - Supporting copy: **Mulai gratis, lalu upgrade toko pilihanmu sekali saja untuk akses Lifetime.**
2. Two pricing cards
   - Free first, Lifetime second.
   - Visually emphasize Lifetime and label it **Direkomendasikan**.
   - Do not add monthly/annual toggles.
3. Feature comparison table
   - Compare the limits and features listed above.
   - Ensure the table remains usable on mobile through horizontal scrolling or a stacked layout.
4. Per-store explanation
   - Briefly explain multiple-store purchases with an example: an owner with three Lifetime stores has made three separate Lifetime purchases.
5. FAQ
6. Final CTA

## Suggested FAQ

### Apakah Lifetime benar-benar tidak kedaluwarsa?

Ya. Lifetime aktif selamanya untuk toko yang dipilih dan tidak memiliki biaya perpanjangan.

### Apakah satu pembelian berlaku untuk semua toko?

Tidak. Satu pembelian Lifetime berlaku untuk satu toko. Toko lain tetap menggunakan Free sampai di-upgrade secara terpisah.

### Apakah saya bisa memiliki beberapa toko Lifetime?

Ya. Kamu dapat membeli Lifetime beberapa kali dan memilih toko yang berbeda untuk setiap pembelian.

### Apa yang terjadi pada toko baru?

Setiap toko baru dimulai dengan Free secara otomatis.

### Apakah harga Lifetime dapat berubah?

Ya. Harga dapat disesuaikan di masa depan. Harga yang ditampilkan ketika checkout adalah harga yang berlaku saat pembelian.

## CTA behavior

- **Mulai Gratis**
  - Signed out: send the visitor to sign-up with a dashboard return URL.
  - Signed in: send the user to the dashboard/store creation flow.
- **Beli Lifetime**
  - Signed out: send the visitor to sign-in/sign-up, then return them to billing.
  - Signed in: send the user to the billing page, where they must select the store receiving Lifetime.

Preserve campaign query parameters where supported.

## Data and integration requirements

- Prefer the public plans endpoint as the runtime source of truth when it is available:

```text
GET /subscriptions/plans
```

- Match plans by stable keys: `free` and `lifetime`.
- Format prices with the `id-ID` locale and `IDR` currency.
- Never infer Lifetime as account-wide from the authenticated user. Checkout must remain store-specific.
- Do not create a checkout directly from the public homepage without a selected store.
- If plans cannot be loaded, show a retry state rather than silently displaying an outdated price.

## Responsive and accessibility requirements

- Use semantic headings and keep a single `h1`.
- Every CTA must be keyboard accessible and have a visible focus state.
- Do not communicate availability using color alone.
- Maintain WCAG AA text contrast.
- On small screens, stack the pricing cards and keep the Lifetime price and CTA visible without horizontal scrolling.
- Avoid layout shifts while pricing data loads by reserving card space or using skeletons.

## Acceptance criteria

- Only Free and Lifetime are shown.
- Lifetime displays **Rp2.500.000** and clearly says it is a one-time, per-store payment.
- No monthly or annual billing controls are present.
- The 100-product, 100-promo-code, and 100-permanent-link limits are accurate.
- Multiple Lifetime purchases for different stores are explained.
- Price output comes from one configurable source or the plans API.
- CTAs route authenticated and unauthenticated visitors correctly.
- The page works on mobile, tablet, and desktop.
- Loading, API failure, keyboard navigation, and focus states are covered.

## Release note

Before publishing, verify that the backend plans endpoint and checkout amount also return **IDR 2,500,000**. The homepage must never advertise a price that differs from the amount charged at checkout.
