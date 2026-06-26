import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';
import { orderLinksApi, productsApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { useAppStore } from '@/store/authStore';

export function useOrderLinks() {
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();
  const [message, setMessage] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isPermanent, setIsPermanent] = useState(false);
  const links = useQuery({
    queryKey: ['links', store.storeId],
    queryFn: async () => orderLinksApi.list(store.storeId, await getToken()),
  });
  const products = useQuery({
    queryKey: ['link-products', store.storeId],
    queryFn: async () => productsApi.listAll(store.storeId, { limit: 100, archived: false }, await getToken()),
  });
  const createLink = useMutation({
    mutationFn: async () => {
      const product = products.data?.data.find((item) => item.id === selectedProductId) ?? products.data?.data[0];
      if (!product) throw new Error('Tambahkan produk terlebih dahulu dari dashboard web.');
      const parsedQuantity = Math.max(1, Number(quantity) || 1);
      return orderLinksApi.create(store.storeId, [{ productId: product.id, quantity: parsedQuantity }], await getToken(), {
        message: message || undefined,
        isPermanent,
      });
    },
    onSuccess: () => {
      setMessage('');
      setQuantity('1');
      setIsPermanent(false);
      links.refetch();
      Alert.alert('Berhasil', 'Link pesanan berhasil dibuat.');
    },
    onError: (error) => Alert.alert('Gagal membuat link', (error as Error).message),
  });

  return {
    message,
    setMessage,
    links,
    products: products.data?.data ?? [],
    selectedProductId,
    setSelectedProductId,
    quantity,
    setQuantity,
    isPermanent,
    setIsPermanent,
    createLink: createLink.mutate,
    creatingLink: createLink.isPending,
    refreshing: links.isRefetching,
    refresh: () => links.refetch(),
  };
}
