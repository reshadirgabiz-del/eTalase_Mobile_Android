import { Link } from 'expo-router';
import { Archive, ChevronRight, Package, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenSkeleton,
  SearchField,
  StatusPill,
  Tabs,
  colors,
} from '@/components/ui';
import { formatIDR, type Product } from '@/lib/types';
import { useT } from '@/lib/i18n';

interface ProductsViewProps {
  search: string;
  products: Product[];
  total: number;
  loading: boolean;
  refreshing?: boolean;
  onSearchChange: (value: string) => void;
  onToggleArchive: (input: { id: string; archived?: boolean }) => void;
  onAddProduct: () => void;
  onRefresh?: () => void;
}

export function ProductsView({
  search,
  products,
  total,
  loading,
  refreshing,
  onSearchChange,
  onToggleArchive,
  onAddProduct,
  onRefresh,
}: ProductsViewProps) {
  const t = useT();
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [selectMode, setSelectMode] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((product) => (tab === 'archive' ? product.isArchived : !product.isArchived));
  }, [products, tab]);

  const activeCount = products.filter((product) => !product.isArchived).length;

  if (loading) return <ScreenSkeleton cards={5} />;

  return (
    <Screen
      title={t('products.title')}
      subtitle={`${activeCount} ${t('products.subtitleActive')} · ${total} ${t('products.subtitleTotal')}`}
      right={
        <Button icon={Plus} size="md" onPress={onAddProduct}>
          {t('products.add')}
        </Button>
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: t('products.tabActive'), icon: Package },
          { value: 'archive', label: t('products.tabArchive'), icon: Archive },
        ]}
      />
      <SearchField value={search} onChangeText={onSearchChange} placeholder={t('products.searchPlaceholder')} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{t('products.multiSelectHint')}</Text>
        <Pressable
          onPress={() => setSelectMode((value) => !value)}
          style={({ pressed }) => [
            {
              paddingHorizontal: 16,
              minHeight: 34,
              borderRadius: 999,
              backgroundColor: selectMode ? colors.text : colors.surface,
              borderWidth: 1,
              borderColor: selectMode ? colors.text : '#DBD4C7',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={{ color: selectMode ? '#FFFFFF' : colors.text, fontSize: 13, fontWeight: '700' }}>
            {selectMode ? t('products.doneSelect') : t('products.select')}
          </Text>
        </Pressable>
      </View>

      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={Package}
          title={tab === 'active' ? t('products.emptyActive') : t('products.emptyArchive')}
          body={tab === 'active' ? t('products.emptyActiveBody') : t('products.emptyArchiveBody')}
        />
      ) : null}
      {filtered.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          selectMode={selectMode}
          onToggleArchive={onToggleArchive}
          tCard={t}
        />
      ))}
    </Screen>
  );
}

function ProductCard({
  product,
  selectMode,
  onToggleArchive,
  tCard,
}: {
  product: Product;
  selectMode: boolean;
  onToggleArchive: (input: { id: string; archived?: boolean }) => void;
  tCard: ReturnType<typeof useT>;
}) {
  return (
    <Link href={`/(app)/products/${product.id}` as never} asChild>
      <Pressable
        onLongPress={() => onToggleArchive({ id: product.id, archived: product.isArchived })}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <StatusPill
            label={product.isActive ? tCard('products.statusActive') : tCard('products.statusInactive')}
            tone={product.isActive ? 'green' : 'neutral'}
            pinTopRight
          />
          <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
            <View style={{
              width: 84,
              alignSelf: 'stretch',
              backgroundColor: '#F1ECDE',
              overflow: 'hidden',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 84, height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={22} color={colors.muted} />
                </View>
              )}
            </View>
            <View style={{ flex: 1, padding: 10, paddingTop: 12, paddingRight: 76, minHeight: 102, justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 17 }}
                >
                  {product.name}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }}
                >
                  {formatIDR(product.discountedPrice ?? product.price)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <StatusPill label={`${tCard('products.stockPrefix')} ${product.stock}`} tone="amber" />
                {product.sku ? (
                  <Text numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1, fontSize: 10.5, color: colors.muted }}>
                    {product.sku}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              alignItems: 'flex-end',
            }}>
              {selectMode ? (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => onToggleArchive({ id: product.id, archived: product.isArchived })}
                >
                  {product.isArchived ? tCard('products.restore') : tCard('products.archive')}
                </Button>
              ) : (
                <ChevronRight size={18} color={colors.subtle} />
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
