import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';
import { ordersApi, orderLinksApi, productsApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/authStore';

export interface SelectedItem {
  productId: string;
  quantity: number;
}

export type OrderLinkFilter = 'all' | 'preset' | 'history' | 'permanent' | 'expired';

export function useOrderLinks() {
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();

  const [message, setMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isPermanent, setIsPermanent] = useState(false);
  const [linkType, setLinkType] = useState<'preset' | 'history'>('preset');
  const [customerLabel, setCustomerLabel] = useState('');
  const [filter, setFilter] = useState<OrderLinkFilter>('all');

  const links = useQuery({
    queryKey: ['links', store.storeId],
    queryFn: async () => orderLinksApi.list(store.storeId, await getToken()),
  });

  const products = useQuery({
    queryKey: ['link-products', store.storeId],
    queryFn: async () => productsApi.listAll(store.storeId, { limit: 200, archived: false }, await getToken()),
  });

  const customers = useQuery({
    queryKey: ['history-customers', store.storeId],
    queryFn: async () => ordersApi.listCustomersWithHistory(store.storeId, await getToken()),
  });

  const resetForm = () => {
    setSelectedItems([]);
    setMessage('');
    setIsPermanent(false);
    setLinkType('preset');
    setCustomerLabel('');
  };

  const toggleProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { productId, quantity: 1 }]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
    }
  };

  const setQuantity = (productId: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i)),
    );
  };

  const createLink = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (linkType === 'preset' && selectedItems.length === 0) {
        throw new Error(t('alert.pickImageFirst'));
      }
      if (linkType === 'history' && !customerLabel.trim()) {
        throw new Error(t('alert.mustPickCustomer'));
      }
      const trimmedLabel = customerLabel.trim();
      const link = await orderLinksApi.create(
        store.storeId,
        linkType === 'history' ? [] : selectedItems,
        token,
        {
          message: linkType === 'preset' ? message.trim() || undefined : undefined,
          isPermanent: linkType === 'history' || isPermanent,
          linkType,
          customerLabel: linkType === 'history' ? trimmedLabel : undefined,
        },
      );
      if (linkType === 'history') {
        const match = customers.data?.find(
          (c) => c.name.toLowerCase() === trimmedLabel.toLowerCase(),
        );
        if (match) {
          try {
            await orderLinksApi.assignOrder(link.id, match.latestOrderId, store.storeId, token);
          } catch {
            /* non-fatal: link stays usable */
          }
        }
      }
      return link;
    },
    onSuccess: () => {
      resetForm();
      links.refetch();
      Alert.alert(t('common.success'), t('alert.linkCreated'));
    },
    onError: (error) => Alert.alert(t('alert.linkCreateFailed'), (error as Error).message),
  });

  const removeLink = useMutation({
    mutationFn: async (id: string) => orderLinksApi.remove(id, store.storeId, await getToken()),
    onSuccess: () => links.refetch(),
    onError: (error) => Alert.alert(t('alert.linkDeleteFailed'), (error as Error).message),
  });

  return {
    message,
    setMessage,
    links,
    products: products.data?.data ?? [],
    customers: customers.data ?? [],
    selectedItems,
    toggleProduct,
    setQuantity,
    isPermanent,
    setIsPermanent,
    linkType,
    setLinkType,
    customerLabel,
    setCustomerLabel,
    filter,
    setFilter,
    resetForm,
    createLink: createLink.mutate,
    creatingLink: createLink.isPending,
    removeLink: removeLink.mutate,
    removing: removeLink.isPending,
    refreshing: links.isRefetching,
    refresh: () => {
      links.refetch();
      customers.refetch();
    },
  };
}
