import { useLocalSearchParams, useRouter } from 'expo-router';
import { OrderDetailView } from '@/components/orders/OrderDetailView';
import { useOrderDetail } from '@/features/orders/useOrderDetail';
import { useAppStore } from '@/store/authStore';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = useOrderDetail(id);
  const role = useAppStore((state) => state.selectedStore?.role);

  return (
    <OrderDetailView
      id={id}
      order={detail.order.data}
      loading={detail.order.isLoading}
      refreshing={detail.order.isRefetching}
      trackingNumber={detail.trackingNumber}
      courierName={detail.courierName}
      savingManualShipment={detail.savingManualShipment}
      isOwner={role === 'owner'}
      historyLinkUrl={detail.historyLinkUrl}
      creatingHistoryLink={detail.creatingHistoryLink}
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
      onCreateHistoryLink={() => detail.createHistoryLink()}
      onRefresh={() => detail.order.refetch()}
    />
  );
}
