import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
import { ordersApi, uploadApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
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
      Alert.alert('Berhasil', 'Status pesanan diperbarui.');
    },
    onError: (error) => Alert.alert('Gagal mengubah status', (error as Error).message),
  });

  const manualShipment = useMutation({
    mutationFn: async () => ordersApi.setManualShipment(id, store.storeId, { trackingNumber, courierName }, await getToken()),
    onSuccess: () => {
      order.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipments', store.storeId] });
      Alert.alert('Berhasil', 'Nomor resi disimpan.');
    },
    onError: (error) => Alert.alert('Gagal menyimpan resi', (error as Error).message),
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
      Alert.alert('Berhasil', order.data?.isArchived ? 'Pesanan dipulihkan.' : 'Pesanan diarsipkan.');
    },
    onError: (error) => Alert.alert('Gagal mengubah arsip', (error as Error).message),
  });

  const confirmTransfer = useMutation({
    mutationFn: async () => ordersApi.confirmBankTransfer(id, store.storeId, await getToken()),
    onSuccess: () => {
      order.refetch();
      queryClient.invalidateQueries({ queryKey: ['orders', store.storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipments', store.storeId] });
      Alert.alert('Berhasil', 'Transfer dikonfirmasi.');
    },
    onError: (error) => Alert.alert('Gagal konfirmasi transfer', (error as Error).message),
  });

  const downloadLabel = useMutation({
    mutationFn: async () => ordersApi.downloadAndShareLabelPdf(id, store.storeId, await getToken()),
    onSuccess: () => Alert.alert('Berhasil', 'Label pengiriman siap dibagikan atau disimpan.'),
    onError: (error) => Alert.alert('Gagal download label', (error as Error).message),
  });

  const uploadPhoto = useMutation({
    mutationFn: async (source: PhotoSource) => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error(source === 'camera' ? 'Izin kamera diperlukan untuk mengambil foto.' : 'Izin galeri diperlukan untuk memilih foto.');
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
      if (updated) Alert.alert('Berhasil', 'Foto bukti berhasil diupload.');
    },
    onError: (error) => Alert.alert('Gagal upload foto', (error as Error).message),
  });

  const choosePhoto = () => {
    Alert.alert('Upload Foto Bukti', 'Pilih sumber foto untuk dilampirkan ke pesanan.', [
      { text: 'Kamera', onPress: () => uploadPhoto.mutate('camera') },
      { text: 'Galeri', onPress: () => uploadPhoto.mutate('library') },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const openAttachment = (url?: string | null) => {
    if (!url) {
      Alert.alert('Lampiran tidak tersedia', 'File ini belum memiliki URL yang bisa dibuka.');
      return;
    }
    WebBrowser.openBrowserAsync(url).catch(() => Alert.alert('Gagal membuka lampiran', 'Lampiran belum bisa dibuka.'));
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
  };
}
