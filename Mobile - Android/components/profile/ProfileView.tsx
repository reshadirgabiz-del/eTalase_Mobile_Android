import {
  ArrowLeftRight,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crown,
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
  LanguageToggle,
  Screen,
  SectionLabel,
  StatusPill,
  StoreAvatar,
  ToggleRow,
  colors,
} from '@/components/ui';
import type { StoreAccess } from '@/lib/types';
import { planDisplayName } from '@/lib/plans';
import { useT, type TranslationKey } from '@/lib/i18n';

interface ProfileViewProps {
  store: StoreAccess;
  userName: string;
  userEmail: string;
  onSwitchStore: () => void;
  onLogout: () => void;
  onOpenStorefront: () => void;
  onOpenPlan: () => void;
  onOpenAccountSettings: () => void;
  onSavePreferences: () => void;
  onEnableDevice: () => void;
}

const ACCESS_ITEMS: { key: TranslationKey; icon: ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'profile.access.viewAll', icon: Inbox },
  { key: 'profile.access.uploadProof', icon: Camera },
  { key: 'profile.access.markReceived', icon: CheckCircle2 },
  { key: 'profile.access.manageStatus', icon: ArrowLeftRight },
  { key: 'profile.access.archive', icon: Inbox },
  { key: 'profile.access.shipments', icon: Plane },
  { key: 'profile.access.products', icon: Package },
  { key: 'profile.access.links', icon: Link2 },
];

export function ProfileView({
  store,
  userName,
  userEmail,
  onSwitchStore,
  onLogout,
  onOpenStorefront,
  onOpenPlan,
  onOpenAccountSettings,
  onSavePreferences,
  onEnableDevice,
}: ProfileViewProps) {
  const t = useT();
  const [statusNotif, setStatusNotif] = useState(true);
  const [proofNotif, setProofNotif] = useState(true);
  const [stockNotif, setStockNotif] = useState(true);

  const initial = (userName || userEmail || '?').slice(0, 1).toUpperCase();

  return (
    <Screen
      title={t('profile.title')}
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
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{userName || t('profile.userFallback')}</Text>
            <Text style={{ color: '#B7B1A2', marginTop: 2, fontSize: 12 }}>{userEmail}</Text>
          </View>
        </View>
      </View>

      <Card>
        <SectionLabel icon={Store}>{t('profile.activeStore')}</SectionLabel>
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
              <StatusPill label={planDisplayName(store.plan)} tone={store.plan === 'lifetime' ? 'green' : 'neutral'} />
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Button variant="light" icon={Globe} onPress={onOpenStorefront} fullWidth>
              {t('profile.viewStore')}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="light" icon={ArrowLeftRight} onPress={onSwitchStore} fullWidth>
              {t('profile.switchStore')}
            </Button>
          </View>
        </View>
      </Card>

      <Card>
        <SectionLabel icon={Globe}>{t('profile.languageSection')}</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>
              {t('profile.languageDesc')}
            </Text>
          </View>
          <LanguageToggle />
        </View>
      </Card>

      <Card>
        <SectionLabel icon={ShieldCheck}>{t('profile.accessTitle')}</SectionLabel>
        <View style={{ gap: 4 }}>
          {ACCESS_ITEMS.map(({ key, icon: Icon }) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 }}>
              <Icon size={14} color={colors.muted} />
              <Text style={{ flex: 1, fontSize: 12.5, color: colors.text }}>{t(key)}</Text>
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
        <SectionLabel icon={Bell}>{t('profile.notifPush')}</SectionLabel>
        <ToggleRow
          title={t('profile.notifStatus')}
          description={t('profile.notifStatusDesc')}
          value={statusNotif}
          onValueChange={setStatusNotif}
        />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <ToggleRow
          title={t('profile.notifProof')}
          description={t('profile.notifProofDesc')}
          value={proofNotif}
          onValueChange={setProofNotif}
        />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <ToggleRow
          title={t('profile.notifStock')}
          description={t('profile.notifStockDesc')}
          value={stockNotif}
          onValueChange={setStockNotif}
        />
        <View style={{ marginTop: 14, gap: 10 }}>
          <Button variant="blue" onPress={onSavePreferences}>{t('profile.savePrefs')}</Button>
          <Button variant="light" icon={Smartphone} onPress={onEnableDevice}>{t('profile.enableDevice')}</Button>
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
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#8A6B12' }}>{t('profile.lifetimeTitle')}</Text>
          <Text style={{ marginTop: 2, color: '#8A6B12', fontSize: 11 }}>{t('profile.lifetimeDesc')}</Text>
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
        <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>{t('profile.logout')}</Text>
      </Pressable>
    </Screen>
  );
}
