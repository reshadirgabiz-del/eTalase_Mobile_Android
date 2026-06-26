export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type MemberRole = 'owner' | 'admin' | 'delivery';

export interface StoreAccess {
  storeId: string;
  storeName: string;
  logoUrl?: string | null;
  storePhotoUrl?: string | null;
  role: MemberRole;
  memberCount: number;
  plan?: string | null;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  subtitle?: string | null;
  description: string;
  price: number;
  discountedPrice?: number | null;
  imageUrl: string;
  stock: number;
  tags?: string[];
  isActive: boolean;
  isArchived?: boolean;
  weightGrams?: number;
  images?: ProductImage[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Address {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface DeliveryOption {
  courierId: string;
  courierName: string;
  courierCode: string;
  serviceName: string;
  serviceType: string;
  price: number;
  estimatedDays: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku?: string | null;
  price: number;
  quantity: number;
}

export interface OrderAttachment {
  id: string;
  filename: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  isArchived?: boolean;
  paymentMethod: 'midtrans' | 'bank_transfer';
  items: OrderItem[];
  address: Address;
  customerEmail?: string | null;
  customerWhatsapp?: string | null;
  deliveryOption: DeliveryOption;
  subtotal: number;
  deliveryFee: number;
  promoDiscount: number;
  total: number;
  bankDetails?: {
    bankTransferText: string;
    bankAccountNumber: string;
    bankRecipientName: string;
    bankName: string;
  } | null;
  trackingNumber?: string | null;
  biteshipOrderId?: string | null;
  proofUrl?: string | null;
  proofSubmittedAt?: string | null;
  attachments?: OrderAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentTrackingEvent {
  status: string;
  note: string;
  updated_at: string;
}

export interface ShipmentTracking {
  success: boolean;
  waybill_id: string;
  courier: { company: string };
  history: ShipmentTrackingEvent[];
  link?: string;
}

export interface OrderLink {
  id: string;
  store_id: string;
  items: { productId: string; variantId?: string; quantity: number }[];
  expires_at: string | null;
  is_permanent: boolean;
  message: string | null;
  created_by: string;
  created_at: string;
}

export interface StoreNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  imageUrl: string | null;
}

export function formatIDR(amount: number | null | undefined): string {
  return 'Rp ' + Number(amount ?? 0).toLocaleString('id-ID');
}

export function shortId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
