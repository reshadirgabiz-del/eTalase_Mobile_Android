import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { storeNotificationsApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import type { StoreNotification } from '@/lib/types';
import { useAppStore } from '@/store/authStore';

export function useNotifications() {
  const store = useAppStore((state) => state.selectedStore)!;
  const router = useRouter();
  const getToken = useApiToken();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications', store.storeId],
    queryFn: async () => storeNotificationsApi.list(store.storeId, await getToken()),
  });
  const markAll = useMutation({
    mutationFn: async () => storeNotificationsApi.markAllRead(store.storeId, await getToken()),
    onSuccess: () => {
      notifications.refetch();
      queryClient.invalidateQueries({ queryKey: ['unread', store.storeId] });
      Alert.alert('Berhasil', 'Semua notifikasi ditandai sudah dibaca.');
    },
    onError: (error) => Alert.alert('Gagal', (error as Error).message),
  });

  const openNotification = (item: StoreNotification) => {
    const metadata = item.metadata ?? {};
    const orderId = metadata.orderId ?? metadata.order_id ?? metadata.orderID;
    const productId = metadata.productId ?? metadata.product_id ?? metadata.productID;
    const linkId = metadata.linkId ?? metadata.link_id ?? metadata.orderLinkId;
    if (typeof orderId === 'string' && orderId) {
      router.push(`/(app)/orders/${orderId}` as never);
      return;
    }
    if (typeof productId === 'string' && productId) {
      router.push(`/(app)/products/${productId}` as never);
      return;
    }
    if (typeof linkId === 'string' && linkId) {
      router.push('/(app)/order-links' as never);
      return;
    }
    Alert.alert('Notifikasi', 'Tidak ada item terkait untuk notifikasi ini.');
  };

  return {
    storeName: store.storeName,
    notifications,
    markAllRead: markAll.mutate,
    markingAllRead: markAll.isPending,
    openNotification,
    refreshing: notifications.isRefetching,
    refresh: () => notifications.refetch(),
    goBack: () => router.back(),
  };
}
