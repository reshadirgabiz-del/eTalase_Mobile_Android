import { OrdersView } from '@/components/orders/OrdersView';
import { useOrders } from '@/features/orders/useOrders';

export default function OrdersScreen() {
  const { orders, unreadCount } = useOrders();

  return (
    <OrdersView
      orders={orders.data?.data}
      total={orders.data?.total ?? 0}
      loading={orders.isLoading}
      error={orders.error as Error | null}
      unreadCount={unreadCount}
      refreshing={orders.isRefetching}
      onRetry={() => orders.refetch()}
      onRefresh={() => orders.refetch()}
    />
  );
}
