import { StoreSelectView } from '@/components/stores/StoreSelectView';
import { useStoreSelect } from '@/features/stores/useStoreSelect';

export default function StoreSelectScreen() {
  const { stores, selectStore } = useStoreSelect();

  return (
    <StoreSelectView
      stores={stores.data}
      loading={stores.isLoading}
      error={stores.error as Error | null}
      refreshing={stores.isRefetching}
      onRetry={() => stores.refetch()}
      onRefresh={() => stores.refetch()}
      onSelectStore={selectStore}
    />
  );
}
