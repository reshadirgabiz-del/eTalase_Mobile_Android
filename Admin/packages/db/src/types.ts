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
  plan: 'starter' | 'growth' | 'business' | 'enterprise';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  expires_at: string | null;
  midtrans_order_id: string | null;
  midtrans_token: string | null;
  created_at: string;
  updated_at: string;
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
