import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { registerPushToken, routeFromNotificationResponse } from '@/lib/notifications';
import { useApiToken } from '@/lib/hooks';
import { useAppStore } from '@/store/authStore';

export function usePushRegistration(storeId?: string | null) {
  const getToken = useApiToken();
  const pushStoreId = useAppStore((state) => state.pushStoreId);
  const router = useRouter();

  useEffect(() => {
    if (!storeId || pushStoreId === storeId) return;
    let cancelled = false;
    getToken()
      .then((token) => {
        if (!cancelled) return registerPushToken(storeId, token);
        return undefined;
      })
      .catch(() => {
        // Automatic registration is best-effort. The profile screen exposes a manual retry.
      });
    return () => {
      cancelled = true;
    };
  }, [getToken, pushStoreId, storeId]);

  useEffect(() => {
    const openResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const route = routeFromNotificationResponse(response);
      if (route) router.push(route as never);
    };

    openResponse(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(openResponse);
    return () => subscription.remove();
  }, [router]);
}
