import { ChevronRight, LogOut, Store } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenSkeleton,
  SectionLabel,
  StatusPill,
  StoreAvatar,
  colors,
} from '@/components/ui';
import type { StoreAccess } from '@/lib/types';

interface StoreSelectViewProps {
  stores?: StoreAccess[];
  loading: boolean;
  error?: Error | null;
  onRetry: () => void;
  onSelectStore: (store: StoreAccess) => void;
  onLogout?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const AVATAR_PALETTE = [
  { bg: '#E0E7FB', color: '#3F5EBF' },
  { bg: '#ECE0F9', color: '#522F90' },
  { bg: '#E5F0E0', color: '#3D5E30' },
  { bg: '#FBEEC8', color: '#7E5500' },
  { bg: '#FBE0DA', color: '#9C2A1E' },
];

function pickAvatar(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash];
}

export function StoreSelectView({
  stores,
  loading,
  error,
  onRetry,
  onSelectStore,
  onLogout,
  refreshing,
  onRefresh,
}: StoreSelectViewProps) {
  if (loading) return <ScreenSkeleton cards={4} />;

  return (
    <Screen
      title="Pilih Toko"
      subtitle="Selamat datang kembali"
      right={
        onLogout ? (
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [{
              paddingHorizontal: 14,
              minHeight: 32,
              borderRadius: 999,
              backgroundColor: '#FBE0DA',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <LogOut size={12} color={colors.red} />
            <Text style={{ color: colors.red, fontWeight: '700', fontSize: 12 }}>Keluar</Text>
          </Pressable>
        ) : null
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <SectionLabel icon={Store}>{`${stores?.length ?? 0} Toko tersedia`}</SectionLabel>
      {error ? (
        <EmptyState
          icon={Store}
          title="Gagal memuat toko"
          body={error.message}
          action={<Button onPress={onRetry}>Coba lagi</Button>}
        />
      ) : null}
      {!loading && stores?.length === 0 ? (
        <EmptyState icon={Store} title="Belum ada toko" body="Akun ini belum menjadi anggota toko mana pun." />
      ) : null}
      {stores?.map((store) => {
        const palette = pickAvatar(store.storeName || '?');
        return (
          <Pressable
            key={store.storeId}
            onPress={() => onSelectStore(store)}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <Card style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <StoreAvatar
                  name={store.storeName}
                  logoUrl={store.logoUrl ?? store.storePhotoUrl ?? null}
                  bg={palette.bg}
                  color={palette.color}
                  size={48}
                  rounded={14}
                />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{store.storeName}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusPill label={store.role} tone={store.role === 'owner' ? 'purple' : 'blue'} />
                    {store.plan ? <StatusPill label={store.plan} tone="green" /> : null}
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{store.memberCount} anggota</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.subtle} />
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
