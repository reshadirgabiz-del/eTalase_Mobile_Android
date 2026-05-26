# Plans Control File — Usage Guide

The file **`plans.config.ts`** in this directory is the single place to configure all subscription plans.
Editing it automatically updates:

- Server-side feature enforcement (limits, access gates)
- Pricing page (`/pricing`)
- Billing page (`/dashboard/billing`)
- In-app upgrade prompts and alerts

`plans.constants.ts` is auto-derived — **do not edit it directly**.

---

## Quick start

1. Open `plans.config.ts`
2. Find the plan entry you want to change (e.g. `growth: { ... }`)
3. Edit the field
4. Restart the backend: `npm run start:dev`
5. Frontend reflects changes on next page load — no restart needed

---

## Field reference

### Pricing

| Field | Type | Description |
|---|---|---|
| `priceIdr` | `number \| null` | Base price in IDR. Use `null` for Enterprise (shows "Hubungi Kami"). |
| `discount` | `PlanDiscount \| null` | Active promotion. Set to `null` for no discount. |

### Limits

| Field | Type | Description |
|---|---|---|
| `maxStores` | `number \| null` | Max stores the owner can create. `null` = unlimited. |
| `maxProductsPerStore` | `number \| null` | Max products per store. `null` = unlimited. |
| `maxMembersPerStore` | `number \| null` | Max total store members (including owner). `null` = unlimited. |
| `maxPermanentOrderLinks` | `number \| null` | Max permanent order links per store. `0` = disabled. `null` = unlimited. |

### Feature flags

| Field | Type | Description |
|---|---|---|
| `hasCategorization` | `boolean` | Product tags shown on storefront. |
| `hasStorefrontCustomization` | `boolean` | Custom storefront branding. |
| `hasApiAccess` | `boolean` | Access to the Jastip public API. |
| `hasOrderLinks` | `boolean` | Order link feature (temporary links). |
| `hasOrderLinkMessage` | `boolean` | Custom message on order links. |
| `hasProductImport` | `boolean` | Bulk product import via Excel. |

### Display

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | Plan name shown in UI (e.g. "Growth"). |
| `description` | `string` | Short tagline below the plan name. |
| `recommended` | `boolean?` | Highlights the card with a bold border and "Direkomendasikan" badge. |
| `features` | `string[]` | Bullet points listed on the pricing and billing cards. |
| `contactEmail` | `string?` | Email for the Enterprise CTA button. |

---

## Applying a discount

Set the `discount` field on any plan:

```ts
growth: {
  priceIdr: 300_000,
  discount: {
    percent: 20,              // 20% off
    label: 'Hemat 20%',       // badge shown on the card
    validUntil: '2026-07-01', // optional expiry (ISO date)
  },
  ...
}
```

- The checkout will automatically charge the discounted price.
- The pricing and billing cards show the original price crossed out.
- If `validUntil` is set, the badge disappears after that date and full price resumes automatically.
- Remove the discount by setting `discount: null`.

---

## Adding a new plan

1. Add a new key to `PLANS_CONFIG` in `plans.config.ts`.
2. The key becomes the plan's internal `name` (used in the database and API).
3. Restart the backend.

> **Note**: adding a new plan does not auto-create a Midtrans product — set up the pricing in your Midtrans dashboard if needed.

---

## Plan order

Plans are shown in the order they appear in `PLANS_CONFIG`. Reorder the keys to change the display order on pricing/billing cards.
