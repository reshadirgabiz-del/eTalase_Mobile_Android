import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { ordersApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { useAppStore } from '@/store/authStore';

export function useShipments() {
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();
  const queryClient = useQueryClient();
  const orders = useQuery({
    queryKey: ['shipments', store.storeId],
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
  const shipmentOrders = orders.data?.data.filter((order) => ['paid', 'processing', 'shipped'].includes(order.status)) ?? [];

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived?: boolean }) => {
      const token = await getToken();
      return archived
        ? ordersApi.unarchive(id, store.storeId, token)
        : ordersApi.archive(id, store.storeId, token);
    },
    onSuccess: (_updated, variables) => {
      orders.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      Alert.alert('Berhasil', variables.archived ? 'Pengiriman dipulihkan.' : 'Pengiriman diarsipkan.');
    },
    onError: (error) => Alert.alert('Gagal mengubah arsip', (error as Error).message),
  });

  const downloadLabel = useMutation({
    mutationFn: async (id: string) => ordersApi.downloadAndShareLabelPdf(id, store.storeId, await getToken()),
    onSuccess: () => Alert.alert('Berhasil', 'Label pengiriman siap dibagikan atau disimpan.'),
    onError: (error) => Alert.alert('Gagal download label', (error as Error).message),
  });

  return {
    orders,
    shipmentOrders,
    toggleArchive: toggleArchive.mutate,
    downloadLabel: downloadLabel.mutate,
    downloadingLabel: downloadLabel.isPending,
  };
}
