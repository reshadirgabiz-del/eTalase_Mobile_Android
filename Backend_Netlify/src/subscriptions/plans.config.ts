// =============================================================================
// PLANS CONTROL FILE
// =============================================================================
//
// This is the single source of truth for all subscription plan configuration.
// Edit this file to change limits, features, pricing, and discounts.
//
// WHAT THIS FILE CONTROLS:
//   - Server-side enforcement (product limits, member limits, feature gates)
//   - Pricing page (/pricing)
//   - Billing page (/dashboard/billing)
//   - In-app upgrade prompts and alerts
//   - Midtrans checkout amount (uses effective price after discount)
//
// HOW TO APPLY CHANGES:
//   1. Edit the relevant plan entry below.
//   2. Restart the backend:  npm run start:dev
//   3. The frontend reads plan data from the API at runtime — changes appear
//      automatically on next page load. No frontend restart needed.
//
//   OR use the admin page (/admin/plans) to edit live without restarting.
//
// =============================================================================
// DISCOUNTS
// =============================================================================
//
// Set a plan's `discount` field to activate a promotional price.
//
// Example — 20% off Growth until end of June:
//
//   growth: {
//     ...
//     discount: {
//       percent: 20,
//       label: 'Hemat 20%',          // shown as a badge on the pricing card
//       validUntil: '2026-06-30',    // ISO date, shown below the price (optional)
//     },
//   },
//
// The checkout will automatically charge the discounted price.
// Set `discount: null` to remove the promotion.
//
// =============================================================================
// LIMITS — SPECIAL VALUES
// =============================================================================
//
//   null  → unlimited (no cap)
//   0     → feature completely disabled for this plan
//   N     → capped at N
//
// =============================================================================

export interface PlanDiscount {
  /** Percentage off, e.g. 20 for 20% */
  percent: number;
  /** Short label shown as a badge, e.g. "Hemat 20%" */
  label: string;
  /** Optional ISO date after which the discount expires, e.g. "2026-07-01" */
  validUntil?: string;
}

export interface PlanEntry {
  // ─── Pricing ───────────────────────────────────────────────────────────────
  /** Base price in IDR. 0 for free plans. Set null for contact-us plans (Enterprise). */
  priceIdr: number | null;
  /** Active discount. Set null to show full price. */
  discount: PlanDiscount | null;
  /** Per-transaction admin fee in IDR. 0 = no fee. */
  transactionFeeIdr: number;

  // ─── Limits ────────────────────────────────────────────────────────────────
  /** Max number of stores the owner can create. null = unlimited. */
  maxStores: number | null;
  /** Max products per store. null = unlimited. */
  maxProductsPerStore: number | null;
  /** Max total store members including the owner. null = unlimited. */
  maxMembersPerStore: number | null;
  /** Max active temporary (2-hour) order links per store. null = unlimited. */
  maxTemporaryOrderLinks: number | null;
  /** Max permanent (non-expiring) order links per store. 0 = disabled. null = unlimited. */
  maxPermanentOrderLinks: number | null;
  /** Max active promo codes per store. null = unlimited. */
  maxPromoCodes: number | null;

  // ─── Feature flags ─────────────────────────────────────────────────────────
  /** Product tags / categorization on the storefront. */
  hasCategorization: boolean;
  /** Storefront color/logo customization. */
  hasStorefrontCustomization: boolean;
  /** Access to the Jastip public API. */
  hasApiAccess: boolean;
  /** Order link feature (temporary + permanent). */
  hasOrderLinks: boolean;
  /** Custom personal message on order links. */
  hasOrderLinkMessage: boolean;
  /** Bulk product import via Excel template. */
  hasProductImport: boolean;
  /** Whether a promo code can target more than one specific product at once. */
  hasMultiProductPromo: boolean;
  /** Whether the user can log in and use the mobile app. */
  hasMobileApp: boolean;
  /** Whether push & email notifications are sent for this plan. */
  hasNotifications: boolean;

  // ─── Display ───────────────────────────────────────────────────────────────
  displayName: string;
  description: string;
  /** Highlighted on pricing/billing cards. */
  recommended?: boolean;
  /** Feature bullet points shown on pricing and billing cards. */
  features: string[];
  /** Contact email for enterprise CTA button. */
  contactEmail?: string;
}

// =============================================================================
// PLAN DEFINITIONS — edit below
// =============================================================================

export const PLANS_CONFIG: Record<string, PlanEntry> = {
  free: {
    // ── Pricing ──────────────────────────────────────────────────────────────
    priceIdr: 0,
    discount: null,
    transactionFeeIdr: 1000,

    // ── Limits ───────────────────────────────────────────────────────────────
    maxStores: 1,
    maxProductsPerStore: 5,
    maxMembersPerStore: 1,
    maxTemporaryOrderLinks: 10,
    maxPermanentOrderLinks: 0,
    maxPromoCodes: 3,

    // ── Features ─────────────────────────────────────────────────────────────
    hasCategorization: false,
    hasStorefrontCustomization: false,
    hasApiAccess: false,
    hasOrderLinks: true,
    hasOrderLinkMessage: false,
    hasProductImport: false,
    hasMultiProductPromo: false,
    hasMobileApp: false,
    hasNotifications: false,

    // ── Display ──────────────────────────────────────────────────────────────
    displayName: 'Free',
    description: 'Mulai gratis, selamanya',
    features: [
      '1 toko',
      '5 produk per toko',
      'Hanya pemilik (tanpa anggota tim)',
      'Transaksi tidak terbatas (biaya admin IDR 1.000/transaksi)',
      '10 link pesanan sementara',
      '3 kode promo (satu produk per kode)',
      'Halaman pelacakan pesanan publik',
      'Label pengiriman PDF',
    ],
  },

  starter: {
    // ── Pricing ──────────────────────────────────────────────────────────────
    priceIdr: 150_000,
    discount: null,
    transactionFeeIdr: 0,

    // ── Limits ───────────────────────────────────────────────────────────────
    maxStores: 1,
    maxProductsPerStore: 15,
    maxMembersPerStore: 2,
    maxTemporaryOrderLinks: null,
    maxPermanentOrderLinks: 10,
    maxPromoCodes: 10,

    // ── Features ─────────────────────────────────────────────────────────────
    hasCategorization: true,
    hasStorefrontCustomization: false,
    hasApiAccess: false,
    hasOrderLinks: true,
    hasOrderLinkMessage: false,
    hasProductImport: true,
    hasMultiProductPromo: false,
    hasMobileApp: true,
    hasNotifications: true,

    // ── Display ──────────────────────────────────────────────────────────────
    displayName: 'Starter',
    description: 'Untuk memulai bisnis jastip kamu',
    features: [
      '1 toko',
      '15 produk per toko (dengan kategorisasi)',
      '1 anggota tim tambahan',
      'Transaksi tidak terbatas, tanpa biaya admin',
      'Link pesanan sementara tidak terbatas + 10 link permanen',
      '10 kode promo (satu produk per kode)',
      'Mobile app: manajemen stok & transaksi',
      'Notifikasi push & email (status pesanan, stok rendah)',
      'Dukungan merchant',
    ],
  },

  growth: {
    // ── Pricing ──────────────────────────────────────────────────────────────
    priceIdr: 300_000,
    discount: null,
    transactionFeeIdr: 0,

    // ── Limits ───────────────────────────────────────────────────────────────
    maxStores: 3,
    maxProductsPerStore: 50,
    maxMembersPerStore: 5,
    maxTemporaryOrderLinks: null,
    maxPermanentOrderLinks: 50,
    maxPromoCodes: 25,

    // ── Features ─────────────────────────────────────────────────────────────
    hasCategorization: true,
    hasStorefrontCustomization: false,
    hasApiAccess: false,
    hasOrderLinks: true,
    hasOrderLinkMessage: true,
    hasProductImport: true,
    hasMultiProductPromo: true,
    hasMobileApp: true,
    hasNotifications: true,

    // ── Display ──────────────────────────────────────────────────────────────
    displayName: 'Growth',
    description: 'Untuk bisnis jastip yang sedang berkembang',
    recommended: true,
    features: [
      '3 toko',
      '50 produk per toko (dengan kategorisasi)',
      '4 anggota tim tambahan',
      'Transaksi tidak terbatas',
      'Link pesanan sementara tidak terbatas + 50 link permanen dengan pesan personal',
      '25 kode promo (beberapa produk per kode)',
      'Mobile app: manajemen produk, stok & transaksi',
      'Notifikasi push & email',
      'Dukungan merchant prioritas',
      'Bantuan setup',
      'Akses fitur baru lebih awal',
    ],
  },

  business: {
    // ── Pricing ──────────────────────────────────────────────────────────────
    priceIdr: 1_000_000,
    discount: null,
    transactionFeeIdr: 0,

    // ── Limits ───────────────────────────────────────────────────────────────
    maxStores: 10,
    maxProductsPerStore: 200,
    maxMembersPerStore: 26,
    maxTemporaryOrderLinks: null,
    maxPermanentOrderLinks: 100,
    maxPromoCodes: null,

    // ── Features ─────────────────────────────────────────────────────────────
    hasCategorization: true,
    hasStorefrontCustomization: true,
    hasApiAccess: false,
    hasOrderLinks: true,
    hasOrderLinkMessage: true,
    hasProductImport: true,
    hasMultiProductPromo: true,
    hasMobileApp: true,
    hasNotifications: true,

    // ── Display ──────────────────────────────────────────────────────────────
    displayName: 'Business',
    description: 'Untuk bisnis jastip skala besar',
    features: [
      '10 toko',
      '200 produk per toko (dengan kategorisasi)',
      '25 anggota tim tambahan (lebih lanjut berbayar)',
      'Semua fitur Growth',
      '100 link permanen dengan pesan personal',
      '1 kustomisasi storefront (lebih lanjut berbayar)',
      'Dashboard analitik (performa link & kode promo)',
    ],
  },

  enterprise: {
    // ── Pricing ──────────────────────────────────────────────────────────────
    priceIdr: null,
    discount: null,
    transactionFeeIdr: 0,

    // ── Limits ───────────────────────────────────────────────────────────────
    maxStores: null,
    maxProductsPerStore: null,
    maxMembersPerStore: null,
    maxTemporaryOrderLinks: null,
    maxPermanentOrderLinks: null,
    maxPromoCodes: null,

    // ── Features ─────────────────────────────────────────────────────────────
    hasCategorization: true,
    hasStorefrontCustomization: true,
    hasApiAccess: true,
    hasOrderLinks: true,
    hasOrderLinkMessage: true,
    hasProductImport: true,
    hasMultiProductPromo: true,
    hasMobileApp: true,
    hasNotifications: true,

    // ── Display ──────────────────────────────────────────────────────────────
    displayName: 'Enterprise',
    description: 'Untuk bisnis jastip enterprise tanpa batas',
    features: [
      'Semua di Business, tanpa batas',
      'Link permanen tidak terbatas',
      'Akses Jastip API',
      'Dukungan dedicated',
    ],
    contactEmail: 'hello@jastipplatform.com',
  },
};
