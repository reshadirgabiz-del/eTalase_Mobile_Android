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

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Diterima',
  cancelled: 'Dibatalkan',
};

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: '#B07A00',
  paid: '#2F6BD6',
  processing: '#2F6BD6',
  shipped: '#0FB5BA',
  delivered: '#4F7A3E',
  cancelled: '#D64531',
};

const FILTER_OPTIONS: { value: 'all' | OrderStatus; label: string; dotColor: string }[] = [
  { value: 'all', label: 'Semua', dotColor: colors.text },
  { value: 'pending', label: 'Menunggu', dotColor: STATUS_DOT.pending },
  { value: 'paid', label: 'Dibayar', dotColor: STATUS_DOT.paid },
  { value: 'processing', label: 'Diproses', dotColor: STATUS_DOT.processing },
  { value: 'shipped', label: 'Dikirim', dotColor: STATUS_DOT.shipped },
  { value: 'delivered', label: 'Diterima', dotColor: STATUS_DOT.delivered },
  { value: 'cancelled', label: 'Dibatalkan', dotColor: STATUS_DOT.cancelled },
];

export function OrdersView({ orders, total, loading, error, unreadCount, refreshing, onRetry, onRefresh }: OrdersViewProps) {
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

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
      title="Pesanan"
      subtitle={`${total} pesanan`}
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
          { value: 'active', label: 'Aktif', icon: Inbox },
          { value: 'archive', label: 'Arsip', icon: Archive },
        ]}
      />
      <SearchField value={search} onChangeText={setSearch} placeholder="Cari penerima atau produk..." />

      {error ? (
        <EmptyState title="Gagal memuat pesanan" body={error.message} action={<Button onPress={onRetry}>Coba lagi</Button>} />
      ) : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === 'active' ? 'Belum ada pesanan' : 'Arsip kosong'}
          body={
            tab === 'active'
              ? 'Pesanan baru dari storefront akan muncul di sini.'
              : 'Pesanan yang diarsipkan akan muncul di sini.'
          }
        />
      ) : null}
      {filtered.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </Screen>
  );
}

function OrderCard({ order }: { order: Order }) {
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
          <StatusPill label={STATUS_LABEL[order.status] ?? order.status} tone={tone} pinTopRight />
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
            {order.items.length} item · {courier || '-'}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: priceColor, fontWeight: '800', fontSize: 15 }}>{formatIDR(order.total)}</Text>
              <Text style={{ marginTop: 2, color: colors.muted, fontSize: 11 }}>
                Ongkir {formatIDR(order.deliveryFee)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{formatDate(order.createdAt)}</Text>
              <Text style={{ color: colors.subtle, fontSize: 10.5, marginTop: 2 }}>
                Diperbarui {formatDate(order.updatedAt)}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
