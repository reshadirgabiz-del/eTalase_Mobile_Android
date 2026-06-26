import { OrderLinksView } from '@/components/order-links/OrderLinksView';
import { useOrderLinks } from '@/features/order-links/useOrderLinks';

export default function OrderLinksScreen() {
  const orderLinks = useOrderLinks();

  return (
    <OrderLinksView
      message={orderLinks.message}
      links={orderLinks.links.data}
      products={orderLinks.products}
      selectedProductId={orderLinks.selectedProductId}
      quantity={orderLinks.quantity}
      isPermanent={orderLinks.isPermanent}
      loading={orderLinks.links.isLoading}
      creating={orderLinks.creatingLink}
      onMessageChange={orderLinks.setMessage}
      onProductChange={orderLinks.setSelectedProductId}
      onQuantityChange={orderLinks.setQuantity}
      onPermanentChange={orderLinks.setIsPermanent}
      onCreateLink={orderLinks.createLink}
      refreshing={orderLinks.refreshing}
      onRefresh={orderLinks.refresh}
    />
  );
}
