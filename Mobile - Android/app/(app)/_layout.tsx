import { Redirect, Tabs } from 'expo-router';
import { Link, Package, Send, User, WalletCards } from 'lucide-react-native';
import { colors } from '@/components/ui';
import { hasMobileAppAccess } from '@/lib/plans';
import { useAppStore } from '@/store/authStore';

export default function AppTabsLayout() {
  const selectedStore = useAppStore((state) => state.selectedStore);
  const mobileEnabled = hasMobileAppAccess(selectedStore?.plan);
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
      <Tabs.Screen name="orders" options={{ title: 'Pesanan', tabBarIcon: ({ color }) => <WalletCards color={color} size={22} /> }} />
      <Tabs.Screen name="shipments" options={{ title: 'Pengiriman', tabBarIcon: ({ color }) => <Send color={color} size={22} /> }} />
      <Tabs.Screen name="products" options={{ title: 'Produk', tabBarIcon: ({ color }) => <Package color={color} size={22} /> }} />
      <Tabs.Screen name="order-links" options={{ title: 'Link', tabBarIcon: ({ color }) => <Link color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
