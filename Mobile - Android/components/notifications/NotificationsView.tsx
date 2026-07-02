import { Pressable, Text } from 'react-native';
import { Button, Card, EmptyState, Screen, ScreenSkeleton } from '@/components/ui';
import { formatDate, type StoreNotification } from '@/lib/types';
import { useT } from '@/lib/i18n';

interface NotificationsViewProps {
  storeName: string;
  notifications?: StoreNotification[];
  loading: boolean;
  markingAllRead: boolean;
  onBack: () => void;
  onMarkAllRead: () => void;
  onOpenNotification: (item: StoreNotification) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function NotificationsView({
  storeName,
  notifications,
  loading,
  markingAllRead,
  onBack,
  onMarkAllRead,
  onOpenNotification,
  refreshing,
  onRefresh,
}: NotificationsViewProps) {
  const t = useT();
  if (loading) return <ScreenSkeleton cards={4} />;

  return (
    <Screen
      title={t('notifications.title')}
      subtitle={storeName}
      right={<Button variant="light" onPress={onBack}>{t('common.back')}</Button>}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Button variant="light" onPress={onMarkAllRead} disabled={markingAllRead}>{t('notifications.markAllRead')}</Button>
      {notifications?.length === 0 ? <EmptyState title={t('notifications.empty')} body={t('notifications.emptyBody')} /> : null}
      {notifications?.map((item) => (
        <Pressable key={item.id} onPress={() => onOpenNotification(item)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
          <Card style={{ opacity: item.read_at ? 0.65 : 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800' }}>{item.title}</Text>
            <Text style={{ marginTop: 6, color: '#8A8275', lineHeight: 20 }}>{item.body}</Text>
            <Text style={{ marginTop: 10, color: '#B0A899', fontSize: 12 }}>{formatDate(item.created_at)}</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
