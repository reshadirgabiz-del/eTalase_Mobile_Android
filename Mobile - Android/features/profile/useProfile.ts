import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { FRONTEND_BASE } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { registerPushToken, unregisterPushToken } from '@/lib/notifications';
import { useAppStore } from '@/store/authStore';

export function useProfile() {
  const store = useAppStore((state) => state.selectedStore)!;
  const setSelectedStore = useAppStore((state) => state.setSelectedStore);
  const clearAppStore = useAppStore((state) => state.clear);
  const { signOut } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const getToken = useApiToken();

  const switchStore = () => router.push('/store-select' as never);
  const openDashboard = (path: string) => {
    const base = FRONTEND_BASE || 'https://app.e-talase.com';
    WebBrowser.openBrowserAsync(`${base}${path}`);
  };

  const logout = () => {
    Alert.alert(t('alert.logoutTitle'), t('alert.logoutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('storeSelect.logout'),
        style: 'destructive',
        onPress: async () => {
          const token = await getToken().catch(() => null);
          if (token) await unregisterPushToken(token).catch(() => undefined);
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
    openPlan: () => openDashboard(`/dashboard/billing?storeId=${encodeURIComponent(store.storeId)}`),
    openAccountSettings: () => openDashboard('/dashboard/account'),
    savePreferences: () => Alert.alert(t('common.success'), t('alert.notifPrefsSaved')),
    enableDevice: async () => {
      try {
        await registerPushToken(store.storeId, await getToken());
        Alert.alert(t('common.success'), t('alert.deviceEnabled'));
      } catch (error) {
        Alert.alert(t('alert.deviceEnableFailed'), (error as Error).message);
      }
    },
    logout,
  };
}
