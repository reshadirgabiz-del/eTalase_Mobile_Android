import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { storesApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import type { StoreAccess } from '@/lib/types';
import { useAppStore } from '@/store/authStore';

export function useStoreSelect() {
  const { userId } = useAuth();
  const getToken = useApiToken();
  const setSelectedStore = useAppStore((state) => state.setSelectedStore);
  const stores = useQuery({
    queryKey: ['stores', userId],
    queryFn: async () => storesApi.list(await getToken()),
    enabled: Boolean(userId),
  });

  const selectStore = (store: StoreAccess) => {
    setSelectedStore(store);
    router.replace('/(app)/orders' as never);
  };

  return { stores, selectStore };
}
