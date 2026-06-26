import {
  ArrowLeftRight,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crown,
  Gift,
  Globe,
  Inbox,
  Link2,
  LogOut,
  Package,
  Plane,
  Settings,
  ShieldCheck,
  Smartphone,
  Store,
} from 'lucide-react-native';
import { ComponentType, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Button,
  Card,
  Screen,
  SectionLabel,
  StatusPill,
  StoreAvatar,
  ToggleRow,
  colors,
} from '@/components/ui';
import type { StoreAccess } from '@/lib/types';

interface ProfileViewProps {
  store: StoreAccess;
  userName: string;
  userEmail: string;
  onSwitchStore: () => void;
  onLogout: () => void;
  onOpenStorefront: () => void;
  onOpenCredits: () => void;
  onOpenPlan: () => void;
  onOpenAccountSettings: () => void;
  onSavePreferences: () => void;
  onEnableDevice: () => void;
}

const ACCESS_ITEMS: { label: string; icon: ComponentType<{ size?: number; color?: string }> }[] = [
  { label: 'Lihat Semua Pesanan', icon: Inbox },
  { label: 'Upload Foto Bukti Pengiriman', icon: Camera },
  { label: 'Tandai Pesanan Diterima', icon: CheckCircle2 },
  { label: 'Kelola Status Pesanan Lengkap', icon: ArrowLeftRight },
  { label: 'Arsipkan & Pulihkan Pesanan', icon: Inbox },
  { label: 'Buat & Kelola Pengiriman', icon: Plane },
  { label: 'Kelola Produk & Stok', icon: Package },
  { label: 'Kelola Link Pesanan', icon: Link2 },
];

export function ProfileView({
  store,
  userName,
  userEmail,
  onSwitchStore,
  onLogout,
  onOpenStorefront,
  onOpenCredits,
  onOpenPlan,
  onOpenAccountSettings,
  onSavePreferences,
  onEnableDevice,
}: ProfileViewProps) {
  const [statusNotif, setStatusNotif] = useState(true);
  const [proofNotif, setProofNotif] = useState(true);
  const [stockNotif, setStockNotif] = useState(true);

  const initial = (userName || userEmail || '?').slice(0, 1).toUpperCase();

  return (
    <Screen
      title="Profil"
      right={
        <Pressable onPress={onOpenAccountSettings} hitSlop={10}>
          <Settings size={20} color={colors.text} />
        </Pressable>
      }
    >
      <View style={{
        backgroundColor: '#1A1A18',
        borderRadius: 18,
        padding: 14,
        overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 140,
          height: 140,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            backgroundColor: '#3F8DE0',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18 }}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{userName || 'Pengguna'}</Text>
            <Text style={{ color: '#B7B1A2', marginTop: 2, fontSize: 12 }}>{userEmail}</Text>
          </View>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#FFF6E1',
        borderWidth: 1,
        borderColor: '#F1D77A',
      }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#FFC107',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Gift size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#8A6B12' }}>Klaim Rp25.000 credit gratis</Text>
          <Text style={{ marginTop: 2, color: '#8A6B12', fontSize: 11, lineHeight: 15 }}>
            Jawab kuesioner singkat onboarding untuk kickstart toko kamu.
          </Text>
        </View>
        <Pressable onPress={onOpenCredits} style={({ pressed }) => [{
          paddingHorizontal: 12,
          minHeight: 32,
          borderRadius: 9,
          backgroundColor: '#FFB300',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Klaim</Text>
        </Pressable>
      </View>

      <Card>
        <SectionLabel icon={Store}>Toko Aktif</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <StoreAvatar
            name={store.storeName}
            logoUrl={store.logoUrl ?? store.storePhotoUrl ?? null}
            bg="#E0E7FB"
            color="#3F5EBF"
            size={42}
            rounded={12}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.text }}>{store.storeName}</Text>
            <View style={{ marginTop: 5, flexDirection: 'row', gap: 6 }}>
              <StatusPill label={store.role} tone={store.role === 'owner' ? 'purple' : 'blue'} />
              {store.plan ? <StatusPill label={store.plan} tone="green" /> : null}
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Button variant="light" icon={Globe} onPress={onOpenStorefront} fullWidth>
              Lihat Toko
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="light" icon={ArrowLeftRight} onPress={onSwitchStore} fullWidth>
              Ganti Toko
            </Button>
          </View>
        </View>
      </Card>

      <Card>
        <SectionLabel icon={ShieldCheck}>Akses Anda</SectionLabel>
        <View style={{ gap: 4 }}>
          {ACCESS_ITEMS.map(({ label, icon: Icon }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 }}>
              <Icon size={14} color={colors.muted} />
              <Text style={{ flex: 1, fontSize: 12.5, color: colors.text }}>{label}</Text>
              <View style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                backgroundColor: '#2F8C4D',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle2 size={11} color="#FFFFFF" />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <SectionLabel icon={Bell}>Notifikasi Push</SectionLabel>
        <ToggleRow
          title="Status Pesanan"
          description="Perubahan status pesanan"
          value={statusNotif}
          onValueChange={setStatusNotif}
        />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <ToggleRow
          title="Bukti Transfer"
          description="Upload bukti pembayaran"
          value={proofNotif}
          onValueChange={setProofNotif}
        />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <ToggleRow
          title="Stok Menipis"
          description="Stok produk ≤ 5 atau habis"
          value={stockNotif}
          onValueChange={setStockNotif}
        />
        <View style={{ marginTop: 14, gap: 10 }}>
          <Button variant="blue" onPress={onSavePreferences}>Simpan Preferensi</Button>
          <Button variant="light" icon={Smartphone} onPress={onEnableDevice}>Aktifkan di Perangkat Ini</Button>
        </View>
      </Card>

      <Pressable style={({ pressed }) => [{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#FFF6DE',
        borderWidth: 1,
        borderColor: '#F1D77A',
        opacity: pressed ? 0.9 : 1,
      }]} onPress={onOpenPlan}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#FFE7A0',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Crown size={18} color="#B07A00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#8A6B12' }}>Upgrade ke Premium</Text>
          <Text style={{ marginTop: 2, color: '#8A6B12', fontSize: 11 }}>Buka fitur premium untuk toko Anda</Text>
        </View>
        <View style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          backgroundColor: '#FFE7A0',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ChevronRight size={14} color="#8A6B12" />
        </View>
      </Pressable>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [{
          minHeight: 44,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: '#F4C6BE',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          opacity: pressed ? 0.85 : 1,
        }]}
      >
        <LogOut size={14} color={colors.red} />
        <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Keluar dari Akun</Text>
      </Pressable>
    </Screen>
  );
}
