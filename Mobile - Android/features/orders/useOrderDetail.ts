import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
import { FRONTEND_BASE, orderLinksApi, ordersApi, uploadApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import type { OrderStatus } from '@/lib/types';
import { useAppStore } from '@/store/authStore';

export const orderStatuses: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
type PhotoSource = 'camera' | 'library';

export function useOrderDetail(id: string) {
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [historyLinkUrl, setHistoryLinkUrl] = useState<string | null>(null);

  const order = useQuery({
    queryKey: ['order', id, store.storeId],
    queryFn: async () => ordersApi.get(id, store.storeId, await getToken()),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: OrderStatus) => ordersApi.updateStatus(id, store.storeId, status, await getToken()),
    onSuccess: () => {
      order.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipments', store.storeId] });
      Alert.alert(t('common.success'), t('alert.orderStatusUpdated'));
    },
    onError: (error) => Alert.alert(t('alert.orderStatusFailed'), (error as Error).message),
  });

  const manualShipment = useMutation({
    mutationFn: async () => ordersApi.setManualShipment(id, store.storeId, { trackingNumber, courierName }, await getToken()),
    onSuccess: () => {
      order.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipments', store.storeId] });
      Alert.alert(t('common.success'), t('alert.trackingSaved'));
    },
    onError: (error) => Alert.alert(t('alert.trackingFailed'), (error as Error).message),
  });

  const archiveOrder = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return order.data?.isArchived
        ? ordersApi.unarchive(id, store.storeId, token)
        : ordersApi.archive(id, store.storeId, token);
    },
    onSuccess: (_updated) => {
      order.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipments', store.storeId] });
      Alert.alert(t('common.success'), order.data?.isArchived ? t('alert.unarchived') : t('alert.archived'));
    },
    onError: (error) => Alert.alert(t('alert.archiveFailed'), (error as Error).message),
  });

  const confirmTransfer = useMutation({
    mutationFn: async () => ordersApi.confirmBankTransfer(id, store.storeId, await getToken()),
    onSuccess: () => {
      order.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipments', store.storeId] });
      Alert.alert(t('common.success'), t('alert.transferConfirmed'));
    },
    onError: (error) => Alert.alert(t('alert.transferFailed'), (error as Error).message),
  });

  const downloadLabel = useMutation({
    mutationFn: async () => ordersApi.downloadAndShareLabelPdf(id, store.storeId, await getToken()),
    onSuccess: () => Alert.alert(t('common.success'), t('alert.labelReady')),
    onError: (error) => Alert.alert(t('alert.labelFailed'), (error as Error).message),
  });

  const uploadPhoto = useMutation({
    mutationFn: async (source: PhotoSource) => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error(source === 'camera' ? t('alert.cameraPermission') : t('alert.galleryPermission'));
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        allowsEditing: false,
      };
      const picked =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (picked.canceled || !picked.assets[0]) return null;

      const asset = picked.assets[0];
      const token = await getToken();
      const fallbackName = `order-${id.slice(0, 8)}-${Date.now()}.jpg`;
      const name = asset.fileName || fallbackName;
      const type = asset.mimeType || 'image/jpeg';
      const { url } = await uploadApi.image({ uri: asset.uri, name, type }, token);
      return ordersApi.addAttachment(
        id,
        store.storeId,
        {
          filename: name,
          size: asset.fileSize ?? 0,
          uploadedAt: new Date().toISOString(),
          url,
        },
        token,
      );
    },
    onSuccess: (updated) => {
      if (updated) order.refetch();
      if (updated) Alert.alert(t('common.success'), t('alert.photoUploaded'));
    },
    onError: (error) => Alert.alert(t('alert.photoFailed'), (error as Error).message),
  });

  const choosePhoto = () => {
    Alert.alert(t('alert.uploadPhotoTitle'), t('alert.uploadPhotoBody'), [
      { text: t('alert.camera'), onPress: () => uploadPhoto.mutate('camera') },
      { text: t('alert.gallery'), onPress: () => uploadPhoto.mutate('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const createHistoryLink = useMutation({
    mutationFn: async () => {
      const current = order.data;
      if (!current) throw new Error(t('alert.orderNotReady'));
      const token = await getToken();
      const link = await orderLinksApi.create(store.storeId, [], token, {
        isPermanent: true,
        linkType: 'history',
        customerLabel: current.address.recipientName,
      });
      await orderLinksApi.assignOrder(link.id, current.id, store.storeId, token);
      const base = FRONTEND_BASE || 'https://app.e-talase.com';
      return `${base}/${store.storeId}/order-link/${link.id}`;
    },
    onSuccess: (url) => {
      setHistoryLinkUrl(url);
      queryClient.invalidateQueries({ queryKey: ['links', store.storeId] });
      Alert.alert(t('common.success'), t('alert.historyLinkCreated'));
    },
    onError: (error) => Alert.alert(t('alert.historyLinkFailed'), (error as Error).message),
  });

  const openAttachment = (url?: string | null) => {
    if (!url) {
      Alert.alert(t('alert.attachmentUnavailableTitle'), t('alert.attachmentUnavailableBody'));
      return;
    }
    WebBrowser.openBrowserAsync(url).catch(() => Alert.alert(t('alert.attachmentOpenFailedTitle'), t('alert.attachmentOpenFailedBody')));
  };

  return {
    order,
    trackingNumber,
    setTrackingNumber,
    courierName,
    setCourierName,
    updateStatus: updateStatus.mutate,
    saveManualShipment: manualShipment.mutate,
    savingManualShipment: manualShipment.isPending,
    toggleArchive: archiveOrder.mutate,
    archiving: archiveOrder.isPending,
    confirmTransfer: confirmTransfer.mutate,
    confirmingTransfer: confirmTransfer.isPending,
    downloadLabel: downloadLabel.mutate,
    downloadingLabel: downloadLabel.isPending,
    uploadPhoto: choosePhoto,
    uploadingPhoto: uploadPhoto.isPending,
    openAttachment,
    historyLinkUrl,
    createHistoryLink: createHistoryLink.mutate,
    creatingHistoryLink: createHistoryLink.isPending,
    resetHistoryLink: () => setHistoryLinkUrl(null),
  };
}
