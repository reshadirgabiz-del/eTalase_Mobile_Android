import { useLocalSearchParams, useRouter } from 'expo-router';
import { OrderDetailView } from '@/components/orders/OrderDetailView';
import { useOrderDetail } from '@/features/orders/useOrderDetail';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = useOrderDetail(id);

  return (
    <OrderDetailView
      id={id}
      order={detail.order.data}
      loading={detail.order.isLoading}
      refreshing={detail.order.isRefetching}
      trackingNumber={detail.trackingNumber}
      courierName={detail.courierName}
      savingManualShipment={detail.savingManualShipment}
      onBack={() => router.back()}
      onTrackingNumberChange={detail.setTrackingNumber}
      onCourierNameChange={detail.setCourierName}
      onUpdateStatus={detail.updateStatus}
      onSaveManualShipment={detail.saveManualShipment}
      onToggleArchive={detail.toggleArchive}
      archiving={detail.archiving}
      onConfirmTransfer={detail.confirmTransfer}
      confirmingTransfer={detail.confirmingTransfer}
      onDownloadLabel={detail.downloadLabel}
      downloadingLabel={detail.downloadingLabel}
      onUploadPhoto={detail.uploadPhoto}
      uploadingPhoto={detail.uploadingPhoto}
      onOpenAttachment={detail.openAttachment}
      onRefresh={() => detail.order.refetch()}
    />
  );
}
