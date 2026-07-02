import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pushNotificationsApi } from '@/lib/api';
import { useAppStore } from '@/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
  );
}

function getNotificationRoute(data: Record<string, unknown>) {
  const orderId = data.orderId ?? data.order_id ?? data.orderID;
  const productId = data.productId ?? data.product_id ?? data.productID;
  const linkId = data.linkId ?? data.link_id ?? data.orderLinkId;
  if (typeof orderId === 'string' && orderId) return `/(app)/orders/${orderId}`;
  if (typeof productId === 'string' && productId) return `/(app)/products/${productId}`;
  if (typeof linkId === 'string' && linkId) return '/(app)/order-links';
  return null;
}

export function routeFromNotificationResponse(response: Notifications.NotificationResponse) {
  return getNotificationRoute(response.notification.request.content.data);
}

export async function registerPushToken(storeId: string, authToken: string) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  const finalPermission =
    permission.status === 'granted' ? permission : await Notifications.requestPermissionsAsync();
  if (finalPermission.status !== 'granted') {
    throw new Error('Izin notifikasi belum diberikan.');
  }

  const projectId = getProjectId();
  if (!projectId) throw new Error('EAS projectId tidak ditemukan di konfigurasi Expo.');

  const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const deviceLabel = Constants.deviceName || `${Platform.OS} device`;
  await pushNotificationsApi.registerToken(
    {
      token: expoToken,
      storeId,
      deviceLabel,
      platform: Platform.OS,
    },
    authToken,
  );
  useAppStore.getState().setPushRegistration(expoToken, storeId);
  return expoToken;
}

export async function unregisterPushToken(authToken: string) {
  const { pushToken, pushStoreId, setPushRegistration } = useAppStore.getState();
  if (!pushToken) return;
  try {
    await pushNotificationsApi.unregisterToken(pushToken, authToken, pushStoreId);
  } finally {
    setPushRegistration(null, null);
  }
}
