export type Plan = 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export type DashboardStats = {
  stores: number;
  subscriptions: { active: number; pending: number; expired: number; cancelled: number };
  vouchers: { total: number; active: number };
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  expires_at: string | null;
  midtrans_order_id: string | null;
  amount_paid: number | null;
  payment_proof_url: string | null;
  payment_proof_submitted_at: string | null;
  is_archived: boolean;
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
  applicable_plan: Plan | null;
  applicable_billing_cycle: 'monthly' | 'annual' | null;
  created_at: string;
};

export type PlanPrice = {
  plan: Plan;
  price_idr: number | null;
  updated_at?: string;
};

export type StoreListRow = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  member_count: number;
  owner_id: string | null;
  plan: Plan | null;
  sub_expires_at: string | null;
};

export type TopupRequest = {
  id: string;
  user_id: string;
  amount_idr: number;
  unique_code: string;
  status: string;
  created_at: string;
};

export type RefundRequest = {
  id: string;
  user_id: string;
  amount_idr: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  contact_email: string;
  message: string | null;
  status: string;
  created_at: string;
};

export type BillingSettings = {
  bankName: string;
  bankAccountNumber: string;
  bankRecipientName: string;
  bankInstructions: string;
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

export type CreditBalance = {
  user_id: string;
  balance_idr: number;
  updated_at: string;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  amount_idr: number;
  type: 'topup' | 'deduction' | 'refund';
  description: string;
  reference_id: string | null;
  created_at: string;
};
