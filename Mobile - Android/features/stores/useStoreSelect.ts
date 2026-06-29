import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { FRONTEND_BASE, storesApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { hasMobileAppAccess } from '@/lib/plans';
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
    if (!hasMobileAppAccess(store.plan)) {
      if (store.role !== 'owner') {
        Alert.alert(
          'Paket Lifetime diperlukan',
          'Aplikasi mobile hanya tersedia untuk toko Lifetime. Minta pemilik toko untuk melakukan upgrade.',
        );
        return;
      }

      Alert.alert(
        'Paket Lifetime diperlukan',
        'Aplikasi mobile hanya tersedia untuk toko Lifetime. Upgrade berlaku selamanya untuk satu toko.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Lihat Lifetime',
            onPress: () => {
              const base = FRONTEND_BASE || 'https://app.e-talase.com';
              const url = `${base}/dashboard/billing?plan=lifetime&storeId=${encodeURIComponent(store.storeId)}`;
              void WebBrowser.openBrowserAsync(url);
            },
          },
        ],
      );
      return;
    }

    setSelectedStore(store);
    router.replace('/(app)/orders' as never);
  };

  return { stores, selectStore };
}
