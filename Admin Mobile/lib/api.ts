import type {
  DashboardStats,
  Subscription,
  PlanVoucher,
  PlanPrice,
  StoreListRow,
  TopupRequest,
  RefundRequest,
  BillingSettings,
  Plan,
  StoreMember,
  CreditBalance,
  CreditTransaction,
} from './types';

const BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL ?? 'http://localhost:3003';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

export const dashboardApi = {
  getStats: () => get<DashboardStats>('/api/dashboard'),
};

export const subscriptionsApi = {
  list: () => get<Subscription[]>('/api/subscriptions'),
  activate: (data: { userId: string; plan: string; days: number }) =>
    post<Subscription>('/api/subscriptions', data),
  action: (id: string, action: 'expire' | 'cancel' | 'archive', amount_paid?: number) =>
    patch<Subscription>(`/api/subscriptions/${id}`, {
      action,
      ...(amount_paid !== undefined ? { amount_paid } : {}),
    }),
  confirm: (id: string, amount_paid: number) =>
    patch<Subscription>(`/api/subscriptions/${id}`, { action: 'confirm', amount_paid }),
  cancelStale: () => post<{ cancelled: number }>('/api/subscriptions/cancel-stale'),
  getRevenue: () =>
    get<{
      totalRevenue: number;
      byPlan: Record<string, { count: number; total: number }>;
      payments: Array<{
        id: string;
        user_id: string;
        plan: string;
        amount_paid: number;
        midtrans_order_id: string | null;
        created_at: string;
      }>;
    }>('/api/subscriptions/revenue'),
};

export const vouchersApi = {
  list: () => get<PlanVoucher[]>('/api/vouchers'),
  create: (data: {
    code: string;
    type: 'percent' | 'absolute';
    value: number;
    maxUsages?: number;
    expires?: string;
    applicablePlan?: Plan | null;
  }) => post<PlanVoucher>('/api/vouchers', data),
  toggle: (code: string) => patch<PlanVoucher>(`/api/vouchers/${code}`),
  delete: (code: string) => del<{ success: boolean }>(`/api/vouchers/${code}`),
};

export const plansApi = {
  list: () => get<PlanPrice[]>('/api/plans'),
  updatePrice: (plan: Plan, price_idr: number) =>
    fetch(`${BASE}/api/plans`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, price_idr }),
    }).then((r) => r.json()),
  getBilling: () => get<BillingSettings>('/api/billing'),
  saveBilling: (data: BillingSettings) => patch<BillingSettings>('/api/billing', data),
};

export const storesApi = {
  list: () => get<StoreListRow[]>('/api/stores'),
  getDetail: (id: string) =>
    get<{
      store: { id: string; name: string; logo_url: string | null; created_at: string };
      members: StoreMember[];
      subscriptions: Subscription[];
      orders: Array<{ id: string; status: string; total: number; created_at: string }>;
      products: Array<{ id: string; name: string; is_archived: boolean; created_at: string }>;
    }>(`/api/stores/${id}`),
};

export const creditsApi = {
  list: () =>
    get<{ topups: TopupRequest[]; refunds: RefundRequest[] }>('/api/credits'),
  confirmTopup: (id: string) =>
    post<{ newBalance: number }>(`/api/credits/topup-requests/${id}`),
  handleRefund: (id: string, action: 'approve' | 'reject') =>
    patch<{ ok: boolean }>(`/api/credits/refund-requests/${id}`, { action }),
  listBalances: () =>
    get<{ balances: CreditBalance[] }>('/api/credits/balances'),
  listTransactions: () =>
    get<{ transactions: CreditTransaction[] }>('/api/credits/transactions'),
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatIDR(amount: number): string {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

export function truncate(str: string | null | undefined, len = 12): string {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
