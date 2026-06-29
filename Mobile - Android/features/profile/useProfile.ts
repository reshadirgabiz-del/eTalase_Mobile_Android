import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { FRONTEND_BASE } from '@/lib/api';
import { useAppStore } from '@/store/authStore';

export function useProfile() {
  const store = useAppStore((state) => state.selectedStore)!;
  const setSelectedStore = useAppStore((state) => state.setSelectedStore);
  const clearAppStore = useAppStore((state) => state.clear);
  const { signOut } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const switchStore = () => router.push('/store-select' as never);
  const openDashboard = (path: string) => {
    const base = FRONTEND_BASE || 'https://app.e-talase.com';
    WebBrowser.openBrowserAsync(`${base}${path}`);
  };

  const logout = () => {
    Alert.alert('Keluar?', 'Sesi mobile akan dihapus dari perangkat ini.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setSelectedStore(null);
          queryClient.clear();
          clearAppStore();
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return {
    store,
    userName: user?.fullName ?? '-',
    userEmail: user?.primaryEmailAddress?.emailAddress ?? '-',
    switchStore,
    openStorefront: () => WebBrowser.openBrowserAsync(`https://app.e-talase.com/${store.storeId}`),
    openCredits: () => openDashboard('/dashboard/credits'),
    openPlan: () => openDashboard(`/dashboard/billing?storeId=${encodeURIComponent(store.storeId)}`),
    openAccountSettings: () => openDashboard('/dashboard/account'),
    savePreferences: () => Alert.alert('Berhasil', 'Preferensi notifikasi disimpan di perangkat ini.'),
    enableDevice: () => Alert.alert('Info', 'Jika izin notifikasi perangkat aktif, aplikasi akan menerima notifikasi toko.'),
    logout,
  };
}
