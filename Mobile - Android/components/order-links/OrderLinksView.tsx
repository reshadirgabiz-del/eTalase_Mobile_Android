import { Copy, Link2, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, Share, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
  ScreenSkeleton,
  StatusPill,
  ToggleRow,
  colors,
} from '@/components/ui';
import { FRONTEND_BASE } from '@/lib/api';
import { formatDate, type OrderLink, type Product } from '@/lib/types';

interface OrderLinksViewProps {
  message: string;
  links?: OrderLink[];
  products: Product[];
  selectedProductId: string | null;
  quantity: string;
  isPermanent: boolean;
  loading: boolean;
  creating: boolean;
  onMessageChange: (value: string) => void;
  onProductChange: (id: string) => void;
  onQuantityChange: (value: string) => void;
  onPermanentChange: (value: boolean) => void;
  onCreateLink: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function OrderLinksView({
  message,
  links,
  products,
  selectedProductId,
  quantity,
  isPermanent,
  loading,
  creating,
  onMessageChange,
  onProductChange,
  onQuantityChange,
  onPermanentChange,
  onCreateLink,
  refreshing,
  onRefresh,
}: OrderLinksViewProps) {
  const [creatorOpen, setCreatorOpen] = useState(false);

  const handleCreate = () => {
    onCreateLink();
    setCreatorOpen(false);
  };

  if (loading) return <ScreenSkeleton cards={4} />;

  return (
    <Screen
      title="Link Pesanan"
      subtitle="Bagikan link ke pelanggan"
      right={<Button icon={Plus} onPress={() => setCreatorOpen(true)}>Buat</Button>}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {!loading && links?.length === 0 ? (
        <EmptyState
          icon={Link2}
          iconColor="#7AAFC0"
          title="Belum ada link pesanan"
          body="Buat link untuk memudahkan pelanggan memesan"
        />
      ) : null}

      {links?.map((link) => {
        const url = FRONTEND_BASE ? `${FRONTEND_BASE}/order/${link.id}` : link.id;
        return (
          <Card key={link.id}>
            <StatusPill label={link.is_permanent ? 'permanen' : 'aktif'} tone="green" pinTopRight />
            <View style={{ paddingRight: 80 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.text }}>
                {link.is_permanent ? 'Link permanen' : 'Link sementara'}
              </Text>
            </View>
            <View
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 10,
                backgroundColor: '#F6F3EC',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Link2 size={13} color={colors.muted} />
              <View style={{ flex: 1, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={{ color: colors.green, fontWeight: '700', fontSize: 12.5 }}
                >
                  {url}
                </Text>
              </View>
              <Pressable
                onPress={() => Share.share({ message: url }).catch(() => Alert.alert('Gagal', 'Link belum bisa dibagikan.'))}
                hitSlop={8}
              >
                <Copy size={14} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={{ marginTop: 8, color: colors.muted, fontSize: 11 }}>
              Dibuat {formatDate(link.created_at)}
            </Text>
          </Card>
        );
      })}

      <Modal
        visible={creatorOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCreatorOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            gap: 14,
          }}>
            <View style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 999, backgroundColor: '#DDD6C6' }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Buat link pesanan</Text>
            <Text style={{ color: colors.muted, lineHeight: 20, fontSize: 13 }}>
              Pilih produk, jumlah item, dan jenis link sebelum dibagikan ke pelanggan.
            </Text>
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5 }}>Produk</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {products.map((product) => {
                  const active = (selectedProductId ?? products[0]?.id) === product.id;
                  return (
                    <Button
                      key={product.id}
                      size="sm"
                      variant={active ? 'green' : 'light'}
                      onPress={() => onProductChange(product.id)}
                    >
                      {product.name}
                    </Button>
                  );
                })}
              </View>
            </View>
            <Field
              label="Jumlah"
              value={quantity}
              onChangeText={onQuantityChange}
              keyboardType="numeric"
              placeholder="1"
            />
            <Field value={message} onChangeText={onMessageChange} placeholder="Pesan opsional untuk pelanggan" />
            <ToggleRow
              title="Link Permanen"
              description="Aktifkan jika link tidak perlu kadaluarsa"
              value={isPermanent}
              onValueChange={onPermanentChange}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setCreatorOpen(false)}
                style={{ flex: 1 }}
              >
                <Button variant="light" onPress={() => setCreatorOpen(false)} fullWidth>Batal</Button>
              </Pressable>
              <Pressable onPress={handleCreate} disabled={creating || products.length === 0} style={{ flex: 1 }}>
                <Button onPress={handleCreate} disabled={creating || products.length === 0} fullWidth>
                  Buat Link
                </Button>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
