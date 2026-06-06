// ─── Shopee fee constants ───────────────────────────────────────────────────
// Source: seller.shopee.co.id/edu/article/16055 (2025)
export const SHOPEE_CATEGORIES = [
  { id: 'A', label: 'Fashion & Lifestyle',    examples: 'Pakaian, Tas, Sepatu, Kecantikan, Olahraga, Perlengkapan Rumah', adminFee: { nonStar: 0.065, star: 0.075, mall: 0.102 } },
  { id: 'B', label: 'Elektronik & Gadget',    examples: 'Ponsel, Komputer, TV, Audio, Kamera',                             adminFee: { nonStar: 0.05,  star: 0.06,  mall: 0.085 } },
  { id: 'C', label: 'Makanan & Kesehatan',    examples: 'Makanan & Minuman, Suplemen, Produk Bayi',                       adminFee: { nonStar: 0.035, star: 0.045, mall: 0.065 } },
  { id: 'D', label: 'Otomotif & Industri',    examples: 'Suku Cadang, Aksesoris Kendaraan, Peralatan Industri',           adminFee: { nonStar: 0.03,  star: 0.04,  mall: 0.055 } },
  { id: 'E', label: 'Logam Mulia & Perhiasan',examples: 'Emas, Perak, Berlian, Perhiasan',                                adminFee: { nonStar: 0.025, star: 0.035, mall: 0.0425 } },
] as const

export type ShopeeCategoryId  = 'A' | 'B' | 'C' | 'D' | 'E'
export type ShopeeSellerType   = 'nonStar' | 'star' | 'mall'

export const SHOPEE_SERVICE_FEES = {
  gratisOngkirXtra: { label: 'Gratis Ongkir XTRA', rate: 0.04 },
  promoXtra:        { label: 'Promo XTRA',          rate: 0.014 },
} as const

export const SHOPEE_MALL_FEE_RATE        = 0.018
export const SHOPEE_ORDER_PROCESSING_FEE = 1250

// ─── Tokopedia fee constants ────────────────────────────────────────────────
// Source: seller-id.tokopedia.com/university (2025-2026)
export const TOKOPEDIA_CLUSTERS = [
  { id: 'fashion',     label: 'Fashion',               examples: 'Pakaian, Tas, Sepatu, Aksesoris',          commissionRate: { marketplace: 0.055, mall: 0.075 } },
  { id: 'fmcg',        label: 'FMCG & Rumah Tangga',   examples: 'Makanan, Minuman, Perlengkapan Rumah',     commissionRate: { marketplace: 0.045, mall: 0.065 } },
  { id: 'lifestyle',   label: 'Lifestyle & Kecantikan', examples: 'Kecantikan, Olahraga, Dekorasi, Hobi',    commissionRate: { marketplace: 0.055, mall: 0.07  } },
  { id: 'electronics', label: 'Elektronik & Otomotif',  examples: 'Ponsel, Laptop, Kamera, Otomotif',        commissionRate: { marketplace: 0.04,  mall: 0.055 } },
  { id: 'digital',     label: 'Produk Digital',         examples: 'Voucher, Pulsa, Token Listrik, Game',     commissionRate: { marketplace: 0.05,  mall: 0.07  } },
] as const

export type TokopediaClusterId   = 'fashion' | 'fmcg' | 'lifestyle' | 'electronics' | 'digital'
export type TokopediaSellerType  = 'marketplace' | 'mall'

export const TOKOPEDIA_PREORDER_RATE        = 0.03
export const TOKOPEDIA_MALL_SERVICE_FEE_RATE = 0.018
export const TOKOPEDIA_MALL_SERVICE_FEE_CAP  = 50000
export const TOKOPEDIA_ORDER_PROCESSING_FEE  = 1250
export const TOKOPEDIA_COMMISSION_CAP        = 650000

// ─── Fee calculation ─────────────────────────────────────────────────────────
export interface FeeCalcInputs {
  platform: 'shopee' | 'tokopedia'
  sellingPrice: number
  sellerDiscount: number
  categoryId: ShopeeCategoryId
  sellerType: ShopeeSellerType
  gratisOngkirXtra: boolean
  promoXtra: boolean
  clusterId: TokopediaClusterId
  tokopediaSellerType: TokopediaSellerType
  isPreOrder: boolean
}

export interface ShopeeFeeResult {
  platform: 'shopee'
  netPrice: number
  adminFee: number
  adminFeeRate: number
  mallFee: number
  gratisOngkirXtraFee: number
  promoXtraFee: number
  orderProcessingFee: number
  totalFee: number
  netRevenue: number
}

export interface TokopediaFeeResult {
  platform: 'tokopedia'
  netPrice: number
  commissionFee: number
  commissionRate: number
  preOrderFee: number
  mallServiceFee: number
  orderProcessingFee: number
  totalFee: number
  netRevenue: number
}

export type FeeCalcResult = ShopeeFeeResult | TokopediaFeeResult

export function calculateShopeeFees(inputs: FeeCalcInputs): ShopeeFeeResult {
  const { sellingPrice, sellerDiscount, categoryId, sellerType, gratisOngkirXtra, promoXtra } = inputs
  const netPrice = Math.max(0, sellingPrice - sellerDiscount)
  const category = SHOPEE_CATEGORIES.find(c => c.id === categoryId)!
  const adminFeeRate = category.adminFee[sellerType]
  const adminFee = Math.round(netPrice * adminFeeRate)
  const mallFee = sellerType === 'mall' ? Math.round(netPrice * SHOPEE_MALL_FEE_RATE) : 0
  const gratisOngkirXtraFee = gratisOngkirXtra ? Math.round(netPrice * SHOPEE_SERVICE_FEES.gratisOngkirXtra.rate) : 0
  const promoXtraFee = promoXtra ? Math.round(netPrice * SHOPEE_SERVICE_FEES.promoXtra.rate) : 0
  const orderProcessingFee = SHOPEE_ORDER_PROCESSING_FEE
  const totalFee = adminFee + mallFee + gratisOngkirXtraFee + promoXtraFee + orderProcessingFee
  const netRevenue = sellingPrice - totalFee
  return { platform: 'shopee', netPrice, adminFee, adminFeeRate, mallFee, gratisOngkirXtraFee, promoXtraFee, orderProcessingFee, totalFee, netRevenue }
}

export function calculateTokopediaFees(inputs: FeeCalcInputs): TokopediaFeeResult {
  const { sellingPrice, sellerDiscount, clusterId, tokopediaSellerType, isPreOrder } = inputs
  const netPrice = Math.max(0, sellingPrice - sellerDiscount)
  const cluster = TOKOPEDIA_CLUSTERS.find(c => c.id === clusterId)!
  const commissionRate = cluster.commissionRate[tokopediaSellerType]
  const rawCommission = Math.round(netPrice * commissionRate)
  const commissionFee = Math.min(rawCommission, TOKOPEDIA_COMMISSION_CAP)
  const preOrderFee = isPreOrder ? Math.round(netPrice * TOKOPEDIA_PREORDER_RATE) : 0
  const rawMallServiceFee = tokopediaSellerType === 'mall' ? Math.round(netPrice * TOKOPEDIA_MALL_SERVICE_FEE_RATE) : 0
  const mallServiceFee = Math.min(rawMallServiceFee, TOKOPEDIA_MALL_SERVICE_FEE_CAP)
  const orderProcessingFee = TOKOPEDIA_ORDER_PROCESSING_FEE
  const totalFee = commissionFee + preOrderFee + mallServiceFee + orderProcessingFee
  const netRevenue = sellingPrice - totalFee
  return { platform: 'tokopedia', netPrice, commissionFee, commissionRate, preOrderFee, mallServiceFee, orderProcessingFee, totalFee, netRevenue }
}

// ─── Product categories with fee mapping ────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  { id: 'fashion',     label: 'Fashion & Pakaian',        icon: '👗', shopeeCatId: 'A' as ShopeeCategoryId, tokopediaClusterId: 'fashion'     as TokopediaClusterId },
  { id: 'beauty',      label: 'Kecantikan & Perawatan',   icon: '💄', shopeeCatId: 'A' as ShopeeCategoryId, tokopediaClusterId: 'lifestyle'   as TokopediaClusterId },
  { id: 'food',        label: 'Makanan & Minuman',        icon: '🍱', shopeeCatId: 'C' as ShopeeCategoryId, tokopediaClusterId: 'fmcg'        as TokopediaClusterId },
  { id: 'health',      label: 'Kesehatan & Suplemen',     icon: '💊', shopeeCatId: 'C' as ShopeeCategoryId, tokopediaClusterId: 'fmcg'        as TokopediaClusterId },
  { id: 'electronics', label: 'Elektronik & Gadget',      icon: '📱', shopeeCatId: 'B' as ShopeeCategoryId, tokopediaClusterId: 'electronics' as TokopediaClusterId },
  { id: 'home',        label: 'Perlengkapan Rumah',       icon: '🏠', shopeeCatId: 'A' as ShopeeCategoryId, tokopediaClusterId: 'fmcg'        as TokopediaClusterId },
  { id: 'automotive',  label: 'Otomotif',                 icon: '🚗', shopeeCatId: 'D' as ShopeeCategoryId, tokopediaClusterId: 'electronics' as TokopediaClusterId },
  { id: 'sport',       label: 'Olahraga & Outdoor',       icon: '⚽', shopeeCatId: 'A' as ShopeeCategoryId, tokopediaClusterId: 'lifestyle'   as TokopediaClusterId },
  { id: 'baby',        label: 'Produk Bayi & Anak',       icon: '🍼', shopeeCatId: 'C' as ShopeeCategoryId, tokopediaClusterId: 'fmcg'        as TokopediaClusterId },
  { id: 'craft',       label: 'Kerajinan & Hobi',         icon: '🎨', shopeeCatId: 'A' as ShopeeCategoryId, tokopediaClusterId: 'lifestyle'   as TokopediaClusterId },
  { id: 'jewelry',     label: 'Perhiasan',                icon: '💍', shopeeCatId: 'E' as ShopeeCategoryId, tokopediaClusterId: 'lifestyle'   as TokopediaClusterId },
  { id: 'digital',     label: 'Produk Digital',           icon: '💻', shopeeCatId: 'B' as ShopeeCategoryId, tokopediaClusterId: 'digital'     as TokopediaClusterId },
] as const

export type ProductCategoryId = typeof PRODUCT_CATEGORIES[number]['id']

export const AGE_RANGES = [
  { id: 'under25', label: 'Di bawah 25 tahun' },
  { id: '25-34',   label: '25–34 tahun' },
  { id: '35-44',   label: '35–44 tahun' },
  { id: '45plus',  label: '45 tahun ke atas' },
]

export const SELLING_DURATIONS = [
  { id: 'under1', label: 'Kurang dari 1 tahun' },
  { id: '1-3',    label: '1–3 tahun' },
  { id: '3-5',    label: '3–5 tahun' },
  { id: '5plus',  label: 'Lebih dari 5 tahun' },
]

// ─── Onboarding data model ───────────────────────────────────────────────────
export interface OnboardingData {
  name: string
  ageRange: string
  isSelling: boolean | null
  sellingDuration: string
  productCategory: string
  topProductName: string
  topProductCategory: string
  monthlyRevenue: number
  productPrice: number
  shopeeSellerType: ShopeeSellerType
  shopeeGratisOngkir: boolean
  shopeePromoXtra: boolean
  tokopediaSellerType: TokopediaSellerType
  tokopediaIsPreOrder: boolean
}

export const defaultOnboardingData: OnboardingData = {
  name: '',
  ageRange: '',
  isSelling: null,
  sellingDuration: '',
  productCategory: '',
  topProductName: '',
  topProductCategory: '',
  monthlyRevenue: 0,
  productPrice: 0,
  shopeeSellerType: 'nonStar',
  shopeeGratisOngkir: false,
  shopeePromoXtra: false,
  tokopediaSellerType: 'marketplace',
  tokopediaIsPreOrder: false,
}

export interface StepProps {
  data: OnboardingData
  onNext: (update?: Partial<OnboardingData>) => void
  onBack: () => void
}

// ─── Fee computation helper ──────────────────────────────────────────────────
export function computeMonthlyFees(data: OnboardingData) {
  const productCat = PRODUCT_CATEGORIES.find(c => c.id === data.topProductCategory)
    ?? PRODUCT_CATEGORIES[0]

  const baseInputs: FeeCalcInputs = {
    platform: 'shopee',
    sellingPrice: data.productPrice,
    sellerDiscount: 0,
    categoryId: productCat.shopeeCatId,
    sellerType: data.shopeeSellerType,
    gratisOngkirXtra: data.shopeeGratisOngkir,
    promoXtra: data.shopeePromoXtra,
    clusterId: productCat.tokopediaClusterId,
    tokopediaSellerType: data.tokopediaSellerType,
    isPreOrder: data.tokopediaIsPreOrder,
  }

  const shopeeResult    = calculateShopeeFees({ ...baseInputs, platform: 'shopee' })
  const tokopediaResult = calculateTokopediaFees({ ...baseInputs, platform: 'tokopedia' })

  const unitsPerMonth = data.productPrice > 0
    ? Math.max(1, Math.round(data.monthlyRevenue / data.productPrice))
    : 0

  return {
    shopeePerUnit:    shopeeResult.totalFee,
    tokopediaPerUnit: tokopediaResult.totalFee,
    unitsPerMonth,
    monthlyShopee:    shopeeResult.totalFee * unitsPerMonth,
    monthlyTokopedia: tokopediaResult.totalFee * unitsPerMonth,
  }
}

// ─── Formatting ──────────────────────────────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseRaw(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0
}

export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('id-ID')
}

export function parseCurrencyInput(formatted: string): number {
  return parseRaw(formatted)
}
