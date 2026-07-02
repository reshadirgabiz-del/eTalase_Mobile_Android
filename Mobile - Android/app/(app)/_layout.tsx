import { Redirect, Tabs } from 'expo-router';
import { Link, Package, Send, User, WalletCards } from 'lucide-react-native';
import { colors } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { usePushRegistration } from '@/lib/push-registration';
import { hasMobileAppAccess } from '@/lib/plans';
import { useAppStore } from '@/store/authStore';

export default function AppTabsLayout() {
  const selectedStore = useAppStore((state) => state.selectedStore);
  const mobileEnabled = hasMobileAppAccess(selectedStore?.plan);
  const t = useT();
  usePushRegistration(mobileEnabled ? selectedStore?.storeId : null);
  if (!selectedStore || !mobileEnabled) return <Redirect href={'/store-select' as never} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: '#AAA597',
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 14,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="orders" options={{ title: t('tabs.orders'), tabBarIcon: ({ color }) => <WalletCards color={color} size={22} /> }} />
      <Tabs.Screen name="shipments" options={{ title: t('tabs.shipments'), tabBarIcon: ({ color }) => <Send color={color} size={22} /> }} />
      <Tabs.Screen name="products" options={{ title: t('tabs.products'), tabBarIcon: ({ color }) => <Package color={color} size={22} /> }} />
      <Tabs.Screen name="order-links" options={{ title: t('tabs.links'), tabBarIcon: ({ color }) => <Link color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
