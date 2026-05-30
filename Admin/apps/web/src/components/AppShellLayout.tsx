'use client';

import { AppShell, NavLink, Group, Title, ThemeIcon } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconCreditCard,
  IconTag,
  IconBuildingStore,
  IconDatabase,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: IconLayoutDashboard },
  { label: 'Subscriptions', href: '/subscriptions', icon: IconCreditCard },
  { label: 'Vouchers', href: '/vouchers', icon: IconTag },
  { label: 'Stores', href: '/stores', icon: IconBuildingStore },
  { label: 'Migrations', href: '/migrations', icon: IconDatabase },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md" h="100vh">
      <AppShell.Navbar p="xs">
        <Group px="xs" py="sm" mb="sm" gap="xs">
          <ThemeIcon size="lg" variant="filled" radius="md">
            <IconBuildingStore size={18} />
          </ThemeIcon>
          <Title order={5}>Jastip Admin</Title>
        </Group>

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
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
