'use client';

import { AppShell, NavLink, Group, Title, ThemeIcon, Button } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconCreditCard,
  IconTag,
  IconBuildingStore,
  IconDatabase,
  IconListDetails,
  IconCoin,
  IconPhoto,
  IconLogout,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: IconLayoutDashboard },
  { label: 'Plans', href: '/plans', icon: IconListDetails },
  { label: 'Subscriptions', href: '/subscriptions', icon: IconCreditCard },
  { label: 'Credits', href: '/credits', icon: IconCoin },
  { label: 'Vouchers', href: '/vouchers', icon: IconTag },
  { label: 'Stores', href: '/stores', icon: IconBuildingStore },
  { label: 'Label', href: '/label', icon: IconPhoto },
  { label: 'Migrations', href: '/migrations', icon: IconDatabase },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md" h="100vh">
      <AppShell.Navbar p="xs" style={{ display: 'flex', flexDirection: 'column' }}>
        <Group px="xs" py="sm" mb="sm" gap="xs">
          <ThemeIcon size="lg" variant="filled" radius="md">
            <IconBuildingStore size={18} />
          </ThemeIcon>
          <Title order={5}>Jastip Admin</Title>
        </Group>

        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={16} />}
              active={
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              }
              mb={2}
            />
          ))}
        </div>

        <Button
          variant="subtle"
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          justify="start"
          mt="auto"
          mb="xs"
        >
          Logout
        </Button>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
