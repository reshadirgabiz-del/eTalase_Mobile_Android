import type {
  CustomerWithHistory,
  Order,
  OrderAttachment,
  OrderLink,
  OrderStatus,
  PaginatedResponse,
  Product,
  ShipmentTracking,
  StoreAccess,
  StoreNotification,
  UserProfile,
} from './types';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001';

export const FRONTEND_BASE =
  process.env.EXPO_PUBLIC_FRONTEND_URL?.replace(/\/+$/, '') ?? '';

type Json = Record<string, unknown> | unknown[];

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? error.error ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function body(data: Json): RequestInit {
  return { body: JSON.stringify(data) };
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...(raw as unknown as Product),
    imageUrl: (raw.imageUrl as string) || (raw.image_url as string) || '',
    weightGrams: (raw.weightGrams as number) || (raw.weight_grams as number) || 500,
    images: (raw.images as Product['images']) ?? [],
    variants: (raw.variants as Product['variants']) ?? [],
  };
}

export const mobileAuthApi = {
  exchangeCode: (code: string) =>
    request<{ ticket: string }>('/auth/exchange-code', {
      method: 'POST',
      ...body({ code }),
    }),
};

export const storesApi = {
  list: (token: string) => request<StoreAccess[]>('/stores/my', {}, token),
  getRole: (storeId: string, token: string) =>
    request<{ role: string; storeName: string; logoUrl?: string | null; plan?: string | null } | null>(
      `/stores/${storeId}/my-role`,
      {},
      token,
    ),
};

export const ordersApi = {
  list: (
    storeId: string,
    params: { page?: number; status?: OrderStatus; archived?: boolean },
    token: string,
  ) => {
    const qs = new URLSearchParams({ storeId });
    if (params.page) qs.set('page', String(params.page));
    if (params.status) qs.set('status', params.status);
    if (params.archived !== undefined) qs.set('archived', String(params.archived));
    return request<PaginatedResponse<Order>>(`/orders?${qs}`, {}, token);
  },

  get: (id: string, storeId: string, token: string) =>
    request<Order>(`/orders/${id}?storeId=${storeId}`, {}, token),

  listCustomersWithHistory: (storeId: string, token: string) =>
    request<CustomerWithHistory[]>(`/orders/customers-with-history?storeId=${storeId}`, {}, token),

  updateStatus: (id: string, storeId: string, status: OrderStatus, token: string) =>
    request<Order>(
      `/orders/${id}/status?storeId=${storeId}`,
      { method: 'PATCH', ...body({ status }) },
      token,
    ),

  confirmBankTransfer: (id: string, storeId: string, token: string) =>
    request<Order>(`/orders/${id}/confirm-transfer?storeId=${storeId}`, { method: 'POST' }, token),

  addAttachment: (
    id: string,
    storeId: string,
    attachment: Omit<OrderAttachment, 'id' | 'uploadedBy'>,
    token: string,
  ) =>
    request<Order>(
      `/orders/${id}/attachments?storeId=${storeId}`,
      { method: 'POST', ...body(attachment as unknown as Json) },
      token,
    ),

  archive: (id: string, storeId: string, token: string) =>
    request<Order>(`/orders/${id}/archive?storeId=${storeId}`, { method: 'PATCH' }, token),

  unarchive: (id: string, storeId: string, token: string) =>
    request<Order>(`/orders/${id}/unarchive?storeId=${storeId}`, { method: 'PATCH' }, token),

  createShipment: (
    id: string,
    storeId: string,
    dto: {
      shipperPhone: string;
      courierCompany: string;
      courierType: string;
      insurance?: boolean;
      deliveryType: 'now' | 'scheduled';
      totalWeightGrams: number;
      packageHeight: number;
      packageLength: number;
      packageWidth: number;
      notes?: string;
      cod?: { enabled: boolean; amount: number };
    },
    token: string,
  ) =>
    request<{ order: Order; biteship: { id: string; waybillId: string | null; price: number; status: string | null } }>(
      `/orders/${id}/create-shipment?storeId=${storeId}`,
      { method: 'POST', ...body({ storeId, ...dto }) },
      token,
    ),

  setManualShipment: (
    id: string,
    storeId: string,
    dto: { trackingNumber?: string; courierName?: string },
    token: string,
  ) =>
    request<Order>(
      `/orders/${id}/manual-shipment?storeId=${storeId}`,
      { method: 'PATCH', ...body(dto) },
      token,
    ),

  getTracking: (id: string, storeId: string, token: string) =>
    request<ShipmentTracking>(`/orders/${id}/tracking?storeId=${storeId}`, {}, token),

  getLabelHtml: async (id: string, storeId: string, token: string) => {
    const res = await fetch(`${API_BASE}/orders/${id}/label?storeId=${storeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal memuat label pengiriman');
    return res.text();
  },

  downloadAndShareLabelPdf: async (id: string, storeId: string, token: string) => {
    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) throw new Error('Penyimpanan perangkat tidak tersedia');

    const filename = `shipping-label-${id.slice(0, 8).toUpperCase()}.pdf`;
    const target = `${dir}${filename}`;
    const result = await FileSystem.downloadAsync(
      `${API_BASE}/orders/${id}/label.pdf?storeId=${storeId}`,
      target,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (result.status < 200 || result.status >= 300) {
      throw new Error('Gagal mengunduh label pengiriman');
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Label Pengiriman',
      });
    }

    return result.uri;
  },
};

export const uploadApi = {
  image: async (
    file: { uri: string; name: string; type: string },
    token: string,
  ) => {
    const form = new FormData();
    form.append('file', file as unknown as Blob);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message ?? error.error ?? 'Upload failed');
    }
    return res.json() as Promise<{ url: string }>;
  },
};

export const productsApi = {
  listAll: async (
    storeId: string,
    params: { page?: number; limit?: number; archived?: boolean } = {},
    token: string,
  ) => {
    const qs = new URLSearchParams({ storeId });
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.archived !== undefined) qs.set('archived', String(params.archived));
    const res = await request<PaginatedResponse<Record<string, unknown>>>(`/products/all?${qs}`, {}, token);
    return { ...res, data: res.data.map(normalizeProduct) } as PaginatedResponse<Product>;
  },

  update: (id: string, storeId: string, data: Partial<Product>, token: string) =>
    request<Product>(
      `/products/${id}?storeId=${storeId}`,
      { method: 'PATCH', ...body(data as unknown as Json) },
      token,
    ),

  archive: (id: string, storeId: string, token: string) =>
    request<Product>(`/products/${id}/archive?storeId=${storeId}`, { method: 'PATCH' }, token),

  unarchive: (id: string, storeId: string, token: string) =>
    request<Product>(`/products/${id}/unarchive?storeId=${storeId}`, { method: 'PATCH' }, token),
};

export const orderLinksApi = {
  list: (storeId: string, token: string) =>
    request<OrderLink[]>(`/order-links?storeId=${storeId}`, {}, token),

  create: (
    storeId: string,
    items: { productId: string; quantity: number }[],
    token: string,
    options?: {
      message?: string;
      isPermanent?: boolean;
      linkType?: 'preset' | 'history';
      customerLabel?: string;
    },
  ) =>
    request<OrderLink>(
      `/order-links?storeId=${storeId}`,
      { method: 'POST', ...body({ items, ...options }) },
      token,
    ),

  remove: (id: string, storeId: string, token: string) =>
    request<{ success: boolean }>(`/order-links/${id}?storeId=${storeId}`, { method: 'DELETE' }, token),

  assignOrder: (id: string, orderId: string, storeId: string, token: string) =>
    request<{ success: boolean; linkId: string; orderId: string }>(
      `/order-links/${id}/assign-order?storeId=${storeId}`,
      { method: 'PATCH', ...body({ orderId }) },
      token,
    ),
};

export const storeNotificationsApi = {
  list: (storeId: string, token: string) =>
    request<StoreNotification[]>(`/store-notifications?storeId=${storeId}`, {}, token),

  unreadCount: (storeId: string, token: string) =>
    request<{ count: number }>(`/store-notifications/unread-count?storeId=${storeId}`, {}, token),

  markAllRead: (storeId: string, token: string) =>
    request<{ success: boolean }>(`/store-notifications/read-all?storeId=${storeId}`, { method: 'PATCH' }, token),
};

export const pushNotificationsApi = {
  registerToken: (
    data: { token: string; storeId: string; deviceLabel?: string; platform?: string },
    authToken: string,
  ) =>
    request<{ ok?: boolean; success?: boolean }>(
      '/notifications/token',
      { method: 'POST', ...body(data as unknown as Json) },
      authToken,
    ),

  unregisterToken: (token: string, authToken: string, storeId?: string | null) =>
    request<{ ok?: boolean; success?: boolean }>(
      '/notifications/token',
      { method: 'DELETE', ...body({ token, storeId: storeId ?? undefined } as Json) },
      authToken,
    ),
};

export const profileApi = {
  me: (token: string) => request<UserProfile>('/users/me', {}, token),
};
