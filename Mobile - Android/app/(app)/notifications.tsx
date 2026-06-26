import { NotificationsView } from '@/components/notifications/NotificationsView';
import { useNotifications } from '@/features/notifications/useNotifications';

export default function NotificationsScreen() {
  const notifications = useNotifications();

  return (
    <NotificationsView
      storeName={notifications.storeName}
      notifications={notifications.notifications.data}
      loading={notifications.notifications.isLoading}
      markingAllRead={notifications.markingAllRead}
      onBack={notifications.goBack}
      onMarkAllRead={notifications.markAllRead}
      onOpenNotification={notifications.openNotification}
      refreshing={notifications.refreshing}
      onRefresh={notifications.refresh}
    />
  );
}
