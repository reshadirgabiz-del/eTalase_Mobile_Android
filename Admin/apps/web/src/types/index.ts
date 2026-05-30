export type Plan = 'starter' | 'growth' | 'business' | 'enterprise';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export type Store = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
};

export type StoreMember = {
  id: string;
  store_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'admin' | 'delivery';
  invitation_token: string | null;
  invitation_status: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  expires_at: string | null;
  midtrans_order_id: string | null;
  midtrans_token: string | null;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  store_id: string;
  status: string;
  subtotal: number;
  delivery_price: number;
  total: number;
  recipient_name: string;
  phone: string;
  city: string;
  province: string;
  payment_method: string;
  is_archived: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  is_archived: boolean;
  created_at: string;
};

export type PlanVoucher = {
  id: string;
  code: string;
  discount_type: 'percent' | 'absolute';
  discount_value: number;
  max_usages: number | null;
  current_usages: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type PromoCode = {
  id: string;
  store_id: string;
  code: string;
  discount_type: 'percent' | 'absolute';
  discount_value: number;
  applies_to: 'total' | 'products' | 'delivery';
  expires_at: string | null;
  max_usages: number | null;
  current_usages: number;
  reserved_usages: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
};

export type StoreListRow = Store & {
  member_count: number;
  owner_id: string | null;
  plan: Plan | null;
  sub_expires_at: string | null;
};
