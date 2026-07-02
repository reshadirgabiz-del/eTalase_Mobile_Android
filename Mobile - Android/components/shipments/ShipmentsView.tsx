import { Archive, Clock, Download, Edit3, Inbox, Package } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  FilterDropdown,
  InfoBanner,
  Screen,
  ScreenSkeleton,
  SearchField,
  StatusPill,
  Tabs,
  colors,
  toneAccent,
} from '@/components/ui';
import { shortId, type Order, type OrderStatus } from '@/lib/types';
import { useT, type TranslationKey } from '@/lib/i18n';

const STATUS_LABEL_KEYS: Record<OrderStatus, TranslationKey> = {
  pending: 'orders.status.pending',
  paid: 'orders.status.paid',
  processing: 'orders.status.processing',
  shipped: 'orders.status.shipped',
  delivered: 'orders.status.delivered',
  cancelled: 'orders.status.cancelled',
};

export function ShipmentsView({
  orders,
  loading,
  onToggleArchive,
  onDownloadLabel,
  downloadingLabel,
  onOpenOrder,
  refreshing,
  onRefresh,
}: {
  orders: Order[];
  loading: boolean;
  onToggleArchive: (input: { id: string; archived?: boolean }) => void;
  onDownloadLabel: (id: string) => void;
  downloadingLabel: boolean;
  onOpenOrder: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const t = useT();
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'needs_receipt' | 'with_receipt'>('all');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const archived = Boolean(order.isArchived);
      if (tab === 'active' && archived) return false;
      if (tab === 'archive' && !archived) return false;
      if (filter === 'needs_receipt' && order.trackingNumber) return false;
      if (filter === 'with_receipt' && !order.trackingNumber) return false;
      if (!query) return true;
      const haystack = `${order.address.recipientName} ${order.trackingNumber ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, tab, search, filter]);

  if (loading) return <ScreenSkeleton cards={5} />;

  const FILTER_OPTIONS: { value: 'all' | 'needs_receipt' | 'with_receipt'; label: string; dotColor: string }[] = [
    { value: 'all', label: t('shipments.filter.all'), dotColor: colors.text },
    { value: 'needs_receipt', label: t('shipments.filter.needsReceipt'), dotColor: '#B07A00' },
    { value: 'with_receipt', label: t('shipments.filter.withReceipt'), dotColor: '#0FB5BA' },
  ];

  return (
    <Screen
      title={t('shipments.title')}
      subtitle={`${orders.length} ${t('shipments.subtitleSuffix')}`}
      right={<FilterDropdown value={filter} options={FILTER_OPTIONS} onChange={setFilter} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: t('shipments.tabActive'), icon: Inbox },
          { value: 'archive', label: t('shipments.tabArchive'), icon: Archive },
        ]}
      />
      <SearchField value={search} onChangeText={setSearch} placeholder={t('shipments.searchPlaceholder')} />

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={tab === 'active' ? t('shipments.emptyActive') : t('shipments.emptyArchive')}
          body={tab === 'active' ? t('shipments.emptyActiveBody') : t('shipments.emptyArchiveBody')}
        />
      ) : null}

      {filtered.map((order) => {
        const tone: 'amber' | 'cyan' | 'green' | 'red' | 'blue' = order.trackingNumber
          ? order.status === 'delivered'
            ? 'green'
            : 'cyan'
          : 'amber';
        return (
          <Card key={order.id} accent={toneAccent[tone]}>
            <StatusPill label={t(STATUS_LABEL_KEYS[order.status])} tone={tone} pinTopRight />
            <View style={{ paddingRight: 92 }}>
              <Text style={{ color: colors.subtle, fontWeight: '700', fontSize: 11 }}>{shortId(order.id)}</Text>
            </View>
            <Text style={{ marginTop: 6, fontSize: 15.5, fontWeight: '700', color: colors.text }}>
              {order.address.recipientName}
            </Text>
            <Text style={{ marginTop: 2, color: colors.muted, fontSize: 12 }}>
              {order.address.city}, {order.address.province}
            </Text>
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Package size={12} color={colors.muted} />
              <Text style={{ color: '#5E574C', fontSize: 12 }}>
                {order.deliveryOption?.courierName ?? '-'} {order.deliveryOption?.serviceName ?? ''}
              </Text>
            </View>
            <View style={{ marginTop: 8 }}>
              {order.trackingNumber ? (
                <InfoBanner tone="success" icon={Package}>{t('shipments.trackingPrefix')} {order.trackingNumber}</InfoBanner>
              ) : (
                <InfoBanner tone="warn" icon={Clock}>{t('shipments.noTrackingYet')}</InfoBanner>
              )}
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row', gap: 7 }}>
              <View style={{ flex: 1 }}>
                <Button variant="light" icon={Edit3} fullWidth onPress={() => onOpenOrder(order.id)}>
                  {order.trackingNumber ? t('shipments.viewDetail') : t('shipments.addTracking')}
                </Button>
              </View>
              <Button
                variant="light"
                icon={Download}
                disabled={downloadingLabel}
                onPress={() => onDownloadLabel(order.id)}
              >
                {t('shipments.labelBtn')}
              </Button>
              <Button
                variant="light"
                icon={Archive}
                onPress={() => onToggleArchive({ id: order.id, archived: order.isArchived })}
              >
                {order.isArchived ? t('shipments.restore') : t('shipments.archiveBtn')}
              </Button>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
