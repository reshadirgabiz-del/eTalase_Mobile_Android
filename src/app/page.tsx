'use client';

import { useEffect, useState } from 'react';
import {
  SimpleGrid, Paper, Text, Title, Group, ThemeIcon, Stack, Loader,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCreditCard,
  IconTag,
  IconCircleCheck,
  IconClock,
  IconCircleX,
} from '@tabler/icons-react';

type DashboardStats = {
  stores: number;
  subscriptions: { active: number; pending: number; expired: number; cancelled: number };
  vouchers: { total: number; active: number };
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Paper p="lg" withBorder radius="md">
      <Group justify="space-between">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
          <Title order={2}>{value}</Title>
        </Stack>
        <ThemeIcon size={48} radius="md" color={color} variant="light">
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

function SubStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Paper p="md" withBorder radius="md">
      <Group>
        <ThemeIcon color={color} variant="light" size="md">
          <Icon size={14} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text fw={700} size="lg">
            {value}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader mt="xl" />;
  if (!stats) return null;

  return (
    <Stack gap="xl">
      <Title order={3}>Dashboard</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard label="Total Stores" value={stats.stores} icon={IconBuildingStore} color="teal" />
        <StatCard
          label="Active Subscriptions"
          value={stats.subscriptions.active}
          icon={IconCreditCard}
          color="blue"
        />
        <StatCard
          label="Active Vouchers"
          value={stats.vouchers.active}
          icon={IconTag}
          color="violet"
        />
      </SimpleGrid>

      <Stack gap="xs">
        <Title order={5}>Subscriptions by Status</Title>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <SubStatCard
            label="Active"
            value={stats.subscriptions.active}
            icon={IconCircleCheck}
            color="green"
          />
          <SubStatCard
            label="Pending"
            value={stats.subscriptions.pending}
            icon={IconClock}
            color="yellow"
          />
          <SubStatCard
            label="Expired"
            value={stats.subscriptions.expired}
            icon={IconCircleX}
            color="red"
          />
          <SubStatCard
            label="Cancelled"
            value={stats.subscriptions.cancelled}
            icon={IconCircleX}
            color="gray"
          />
        </SimpleGrid>
      </Stack>

      <Text size="sm" c="dimmed">
        Vouchers: {stats.vouchers.active} active / {stats.vouchers.total} total
      </Text>
    </Stack>
  );
}
