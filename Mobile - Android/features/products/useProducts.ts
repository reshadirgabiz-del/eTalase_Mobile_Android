import { useMutation, useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert } from 'react-native';
import { FRONTEND_BASE, productsApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/authStore';

export function useProducts() {
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();
  const [search, setSearch] = useState('');
  const products = useQuery({
    queryKey: ['products', store.storeId],
    queryFn: async () => {
      const token = await getToken();
      const [active, archived] = await Promise.all([
        productsApi.listAll(store.storeId, { limit: 100, archived: false }, token),
        productsApi.listAll(store.storeId, { limit: 100, archived: true }, token),
      ]);
      return {
        ...active,
        data: [...active.data, ...archived.data],
        total: active.total + archived.total,
      };
    },
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived?: boolean }) => {
      const token = await getToken();
      return archived
        ? productsApi.unarchive(id, store.storeId, token)
        : productsApi.archive(id, store.storeId, token);
    },
    onSuccess: (_updated, variables) => {
      products.refetch();
      Alert.alert(t('common.success'), variables.archived ? t('alert.productRestored') : t('alert.productArchived'));
    },
    onError: (error) => Alert.alert(t('alert.productToggleFailed'), (error as Error).message),
  });

  const filteredProducts = products.data?.data.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  ) ?? [];

  return {
    search,
    setSearch,
    products,
    filteredProducts,
    toggleArchive: toggleArchive.mutate,
    openCreateProduct: () => {
      const target = FRONTEND_BASE ? `${FRONTEND_BASE}/dashboard/products/new` : 'https://app.e-talase.com/dashboard/products/new';
      WebBrowser.openBrowserAsync(target);
    },
  };
}
