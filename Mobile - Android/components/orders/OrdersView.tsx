import { Link } from 'expo-router';
import { Archive, Bell, Inbox } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  FilterDropdown,
  Screen,
  ScreenSkeleton,
  SearchField,
  StatusPill,
  Tabs,
  colors,
  toneAccent,
} from '@/components/ui';
import { formatDate, formatIDR, type Order, type OrderStatus, shortId } from '@/lib/types';
import { orderStatusTone } from '@/features/orders/useOrders';
import { useT, type TranslationKey } from '@/lib/i18n';

interface OrdersViewProps {
  orders?: Order[];
  total: number;
  loading: boolean;
  error?: Error | null;
  unreadCount: number;
  refreshing?: boolean;
  onRetry: () => void;
  onRefresh?: () => void;
}

const STATUS_LABEL_KEYS: Record<OrderStatus, TranslationKey> = {
  pending: 'orders.status.pending',
  paid: 'orders.status.paid',
  processing: 'orders.status.processing',
  shipped: 'orders.status.shipped',
  delivered: 'orders.status.delivered',
  cancelled: 'orders.status.cancelled',
};

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: '#B07A00',
  paid: '#2F6BD6',
  processing: '#2F6BD6',
  shipped: '#0FB5BA',
  delivered: '#4F7A3E',
  cancelled: '#D64531',
};

export function OrdersView({ orders, total, loading, error, unreadCount, refreshing, onRetry, onRefresh }: OrdersViewProps) {
  const t = useT();
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const FILTER_OPTIONS: { value: 'all' | OrderStatus; label: string; dotColor: string }[] = [
    { value: 'all', label: t('orders.filter.all'), dotColor: colors.text },
    { value: 'pending', label: t('orders.status.pending'), dotColor: STATUS_DOT.pending },
    { value: 'paid', label: t('orders.status.paid'), dotColor: STATUS_DOT.paid },
    { value: 'processing', label: t('orders.status.processing'), dotColor: STATUS_DOT.processing },
    { value: 'shipped', label: t('orders.status.shipped'), dotColor: STATUS_DOT.shipped },
    { value: 'delivered', label: t('orders.status.delivered'), dotColor: STATUS_DOT.delivered },
    { value: 'cancelled', label: t('orders.status.cancelled'), dotColor: STATUS_DOT.cancelled },
  ];

  const filtered = useMemo(() => {
    if (!orders) return [];
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const archived = Boolean(order.isArchived);
      if (tab === 'active' && archived) return false;
      if (tab === 'archive' && !archived) return false;
      if (filter !== 'all' && order.status !== filter) return false;
      if (!query) return true;
      const haystack = `${order.address.recipientName} ${order.items.map((item) => item.productName).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, tab, search, filter]);

  if (loading) return <ScreenSkeleton cards={5} />;

  return (
    <Screen
      title={t('orders.title')}
      subtitle={`${total} ${t('orders.subtitleSuffix')}`}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Link href={'/(app)/notifications' as never} asChild>
            <Pressable
              hitSlop={8}
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={17} color={colors.text} />
              {unreadCount ? (
                <View style={{
                  position: 'absolute',
                  right: -4,
                  top: -4,
                  backgroundColor: colors.red,
                  borderRadius: 999,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.bg,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
          <FilterDropdown value={filter} options={FILTER_OPTIONS} onChange={setFilter} />
        </View>
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: t('orders.tabActive'), icon: Inbox },
          { value: 'archive', label: t('orders.tabArchive'), icon: Archive },
        ]}
      />
      <SearchField value={search} onChangeText={setSearch} placeholder={t('orders.searchPlaceholder')} />

      {error ? (
        <EmptyState title={t('orders.errorTitle')} body={error.message} action={<Button onPress={onRetry}>{t('common.retry')}</Button>} />
      ) : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === 'active' ? t('orders.emptyActive') : t('orders.emptyArchive')}
          body={tab === 'active' ? t('orders.emptyActiveBody') : t('orders.emptyArchiveBody')}
        />
      ) : null}
      {filtered.map((order) => (
        <OrderCard key={order.id} order={order} tCard={t} />
      ))}
    </Screen>
  );
}

function OrderCard({ order, tCard }: { order: Order; tCard: ReturnType<typeof useT> }) {
  const tone = orderStatusTone(order.status as OrderStatus);
  const accent = toneAccent[tone];
  const priceColor =
    tone === 'green'
      ? '#3D5E30'
      : tone === 'red'
        ? '#9C2A1E'
        : tone === 'amber'
          ? '#B07A00'
          : tone === 'blue'
            ? '#1F4DA0'
            : '#0FB5BA';
  const courier = order.deliveryOption
    ? `${order.deliveryOption.courierName ?? ''} ${order.deliveryOption.serviceName ?? ''}`.trim()
    : '-';
  return (
    <Link href={`/(app)/orders/${order.id}` as never} asChild>
      <Pressable>
        <Card accent={accent}>
          <StatusPill label={tCard(STATUS_LABEL_KEYS[order.status])} tone={tone} pinTopRight />
          <View style={{ paddingRight: 92 }}>
            <Text style={{ color: '#9B9486', fontWeight: '700', fontSize: 11, letterSpacing: 0.4 }}>{shortId(order.id)}</Text>
          </View>
          <Text style={{ marginTop: 7, fontSize: 15.5, fontWeight: '700', color: colors.text }}>
            {order.address.recipientName}
          </Text>
          <Text style={{ marginTop: 2, color: colors.muted, fontSize: 12 }}>
            {order.address.phone ? `${order.address.phone} · ` : ''}
            {order.address.city}
          </Text>
          <Text style={{ marginTop: 5, color: '#5E574C', fontSize: 12 }}>
            {order.items.length} {tCard('orders.itemsSuffix')} · {courier || '-'}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: priceColor, fontWeight: '800', fontSize: 15 }}>{formatIDR(order.total)}</Text>
              <Text style={{ marginTop: 2, color: colors.muted, fontSize: 11 }}>
                {tCard('orders.shippingPrefix')} {formatIDR(order.deliveryFee)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{formatDate(order.createdAt)}</Text>
              <Text style={{ color: colors.subtle, fontSize: 10.5, marginTop: 2 }}>
                {tCard('orders.updatedPrefix')} {formatDate(order.updatedAt)}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
