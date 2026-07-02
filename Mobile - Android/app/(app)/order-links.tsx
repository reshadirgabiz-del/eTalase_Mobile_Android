import { OrderLinksView } from '@/components/order-links/OrderLinksView';
import { useOrderLinks } from '@/features/order-links/useOrderLinks';
import { useAppStore } from '@/store/authStore';

export default function OrderLinksScreen() {
  const store = useAppStore((state) => state.selectedStore)!;
  const orderLinks = useOrderLinks();

  return (
    <OrderLinksView
      storeId={store.storeId}
      message={orderLinks.message}
      links={orderLinks.links.data}
      products={orderLinks.products}
      customers={orderLinks.customers}
      selectedItems={orderLinks.selectedItems}
      isPermanent={orderLinks.isPermanent}
      linkType={orderLinks.linkType}
      customerLabel={orderLinks.customerLabel}
      filter={orderLinks.filter}
      loading={orderLinks.links.isLoading}
      creating={orderLinks.creatingLink}
      onMessageChange={orderLinks.setMessage}
      onToggleProduct={orderLinks.toggleProduct}
      onQuantityChange={orderLinks.setQuantity}
      onPermanentChange={orderLinks.setIsPermanent}
      onLinkTypeChange={orderLinks.setLinkType}
      onCustomerLabelChange={orderLinks.setCustomerLabel}
      onFilterChange={orderLinks.setFilter}
      onCreateLink={orderLinks.createLink}
      onRemoveLink={orderLinks.removeLink}
      onResetForm={orderLinks.resetForm}
      refreshing={orderLinks.refreshing}
      onRefresh={orderLinks.refresh}
    />
  );
}
