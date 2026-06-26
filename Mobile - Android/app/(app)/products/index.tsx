import { ProductsView } from '@/components/products/ProductsView';
import { useProducts } from '@/features/products/useProducts';

export default function ProductsScreen() {
  const products = useProducts();

  return (
    <ProductsView
      search={products.search}
      products={products.filteredProducts}
      total={products.products.data?.total ?? 0}
      loading={products.products.isLoading}
      refreshing={products.products.isRefetching}
      onSearchChange={products.setSearch}
      onToggleArchive={products.toggleArchive}
      onAddProduct={products.openCreateProduct}
      onRefresh={() => products.products.refetch()}
    />
  );
}
