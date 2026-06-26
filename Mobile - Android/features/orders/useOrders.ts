import { useQuery } from '@tanstack/react-query';
import { ordersApi, storeNotificationsApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import type { OrderStatus } from '@/lib/types';
import { useAppStore } from '@/store/authStore';

export function orderStatusTone(status: OrderStatus) {
  if (status === 'paid' || status === 'shipped') return 'blue' as const;
  if (status === 'delivered') return 'green' as const;
  if (status === 'cancelled') return 'red' as const;
  if (status === 'pending') return 'amber' as const;
  return 'neutral' as const;
}

export function useOrders() {
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();
  const orders = useQuery({
    queryKey: ['orders', store.storeId],
    queryFn: async () => {
      const token = await getToken();
      const [active, archived] = await Promise.all([
        ordersApi.list(store.storeId, { archived: false }, token),
        ordersApi.list(store.storeId, { archived: true }, token),
      ]);
      return {
        ...active,
        data: [...active.data, ...archived.data],
        total: active.total + archived.total,
      };
    },
  });
  const unread = useQuery({
    queryKey: ['unread', store.storeId],
    queryFn: async () => storeNotificationsApi.unreadCount(store.storeId, await getToken()),
  });

  return { orders, unreadCount: unread.data?.count ?? 0 };
}
