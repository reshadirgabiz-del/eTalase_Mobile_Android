import { useRouter } from 'expo-router';
import { ShipmentsView } from '@/components/shipments/ShipmentsView';
import { useShipments } from '@/features/shipments/useShipments';

export default function ShipmentsScreen() {
  const router = useRouter();
  const shipments = useShipments();

  return (
    <ShipmentsView
      orders={shipments.shipmentOrders}
      loading={shipments.orders.isLoading}
      onToggleArchive={shipments.toggleArchive}
      onDownloadLabel={shipments.downloadLabel}
      downloadingLabel={shipments.downloadingLabel}
      onOpenOrder={(id) => router.push(`/(app)/orders/${id}` as never)}
      refreshing={shipments.orders.isRefetching}
      onRefresh={() => shipments.orders.refetch()}
    />
  );
}
