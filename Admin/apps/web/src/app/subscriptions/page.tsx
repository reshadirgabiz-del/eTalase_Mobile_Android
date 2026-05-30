'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Stack, Title, Group, Button, TextInput, Select, Table, Badge,
  Menu, ActionIcon, Text, Loader, Modal, NumberInput, Tabs,
  SimpleGrid, Paper, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  IconDots, IconCircleOff, IconX, IconPlus, IconSearch,
  IconTrash, IconCurrencyDollar,
} from '@tabler/icons-react';
import type { Subscription } from '@/types';
import { formatDate, truncate, formatIDR } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  pending: 'yellow',
  expired: 'red',
  cancelled: 'gray',
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'gray',
  growth: 'teal',
  business: 'blue',
  enterprise: 'violet',
};

const PLANS = ['starter', 'growth', 'business', 'enterprise'];

type Payment = {
  id: string;
  user_id: string;
  plan: string;
  amount_paid: number;
  midtrans_order_id: string | null;
  created_at: string;
};

type RevenueData = {
  totalRevenue: number;
  byPlan: Record<string, { count: number; total: number }>;
  payments: Payment[];
};

export default function SubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');
  const [activateOpen, setActivateOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [cancellingStale, setCancellingStale] = useState(false);
  const [form, setForm] = useState({ userId: '', plan: 'growth', days: 30 as number });

  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/subscriptions');
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    setRevenueLoading(true);
    try {
      const r = await fetch('/api/subscriptions/revenue');
      setRevenue(await r.json());
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(
    () =>
      data.filter((s) => {
        if (statusFilter && s.status !== statusFilter) return false;
        if (userFilter && !s.user_id.toLowerCase().includes(userFilter.toLowerCase())) return false;
        return true;
      }),
    [data, statusFilter, userFilter],
  );

  const handleAction = (id: string, action: 'expire' | 'cancel') => {
    modals.openConfirmModal({
      title: action === 'expire' ? 'Expire subscription?' : 'Cancel subscription?',
      children: <Text size="sm">This action cannot be undone.</Text>,
      labels: { confirm: action === 'expire' ? 'Expire' : 'Cancel', cancel: 'Go back' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const r = await fetch(`/api/subscriptions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        if (r.ok) {
          notifications.show({ color: 'green', message: `Subscription ${action}d` });
          fetchData();
        } else {
          const err = await r.json();
          notifications.show({ color: 'red', message: err.error ?? 'Error' });
        }
      },
    });
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const r = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await r.json();
      if (!r.ok) {
        notifications.show({ color: 'red', message: result.error ?? 'Error' });
        return;
      }
      notifications.show({ color: 'green', message: 'Subscription activated' });
      setActivateOpen(false);
      setForm({ userId: '', plan: 'growth', days: 30 });
      fetchData();
    } finally {
      setActivating(false);
    }
  };

  const handleCancelStale = async () => {
    modals.openConfirmModal({
      title: 'Cancel stale pending subscriptions?',
      children: (
        <Text size="sm">
          This will cancel all pending subscriptions older than 24 hours. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Cancel Stale', cancel: 'Go back' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setCancellingStale(true);
        try {
          const r = await fetch('/api/subscriptions/cancel-stale', { method: 'POST' });
          const result = await r.json();
          if (!r.ok) {
            notifications.show({ color: 'red', message: result.error ?? 'Error' });
          } else {
            notifications.show({ color: 'green', message: `${result.cancelled} subscription(s) cancelled` });
            fetchData();
          }
        } finally {
          setCancellingStale(false);
        }
      },
    });
  };

  return (
    <Stack>
      <Title order={3}>Subscriptions</Title>

      <Tabs defaultValue="subscriptions" onChange={(v) => { if (v === 'revenue') fetchRevenue(); }}>
        <Tabs.List>
          <Tabs.Tab value="subscriptions">Subscriptions</Tabs.Tab>
          <Tabs.Tab value="revenue" leftSection={<IconCurrencyDollar size={14} />}>
            Revenue
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="subscriptions" pt="md">
          <Stack>
            <Group justify="space-between">
              <Group>
                <TextInput
                  placeholder="Filter by user ID…"
                  leftSection={<IconSearch size={14} />}
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.currentTarget.value)}
                  w={240}
                />
                <Select
                  placeholder="All statuses"
                  data={['active', 'pending', 'expired', 'cancelled']}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                  w={160}
                />
                <Text size="sm" c="dimmed">
                  {filtered.length} record(s)
                </Text>
              </Group>
              <Group>
                <Button
                  variant="default"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleCancelStale}
                  loading={cancellingStale}
                  size="sm"
                >
                  Cancel Stale
                </Button>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setActivateOpen(true)}>
                  Activate
                </Button>
              </Group>
            </Group>

            {loading ? (
              <Loader />
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>User ID</Table.Th>
                      <Table.Th>Plan</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Expires</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtered.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={7}>
                          <Text c="dimmed" ta="center" py="md">
                            No subscriptions found
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      filtered.map((s) => (
                        <Table.Tr key={s.id}>
                          <Table.Td>
                            <Text size="xs" c="dimmed" ff="monospace">
                              {truncate(s.id)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" ff="monospace">
                              {truncate(s.user_id, 20)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={PLAN_COLORS[s.plan] ?? 'gray'} variant="light">
                              {s.plan}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={STATUS_COLORS[s.status] ?? 'gray'}>{s.status}</Badge>
                          </Table.Td>
                          <Table.Td>{formatDate(s.expires_at)}</Table.Td>
                          <Table.Td>{formatDate(s.created_at)}</Table.Td>
                          <Table.Td>
                            {(s.status === 'active' || s.status === 'pending') && (
                              <Menu shadow="md" width={160}>
                                <Menu.Target>
                                  <ActionIcon variant="subtle" color="gray">
                                    <IconDots size={16} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item
                                    color="orange"
                                    leftSection={<IconCircleOff size={14} />}
                                    onClick={() => handleAction(s.id, 'expire')}
                                  >
                                    Expire
                                  </Menu.Item>
                                  <Menu.Item
                                    color="red"
                                    leftSection={<IconX size={14} />}
                                    onClick={() => handleAction(s.id, 'cancel')}
                                  >
                                    Cancel
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="revenue" pt="md">
          {revenueLoading ? (
            <Loader />
          ) : revenue ? (
            <Stack>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper p="md" withBorder radius="md">
                  <Text size="xs" c="dimmed">Total Revenue</Text>
                  <Text size="xl" fw={700} c="green">{formatIDR(revenue.totalRevenue)}</Text>
                </Paper>
                <Paper p="md" withBorder radius="md">
                  <Text size="xs" c="dimmed">Paid Subscriptions</Text>
                  <Text size="xl" fw={700}>{revenue.payments.length}</Text>
                </Paper>
                {Object.entries(revenue.byPlan).map(([plan, stats]) => (
                  <Paper key={plan} p="md" withBorder radius="md">
                    <Text size="xs" c="dimmed">
                      <Badge color={PLAN_COLORS[plan] ?? 'gray'} variant="light" size="xs" mr={4}>
                        {plan}
                      </Badge>
                    </Text>
                    <Text size="lg" fw={600}>{formatIDR(stats.total)}</Text>
                    <Text size="xs" c="dimmed">{stats.count} payment(s)</Text>
                  </Paper>
                ))}
              </SimpleGrid>

              <Divider mt="xs" />

              <Title order={5}>Payment History</Title>
              <Table.ScrollContainer minWidth={640}>
                <Table striped withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>User ID</Table.Th>
                      <Table.Th>Plan</Table.Th>
                      <Table.Th>Amount Paid</Table.Th>
                      <Table.Th>Order ID</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {revenue.payments.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5}>
                          <Text c="dimmed" ta="center" py="md">No payments recorded</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      revenue.payments.map((p) => (
                        <Table.Tr key={p.id}>
                          <Table.Td>{formatDate(p.created_at)}</Table.Td>
                          <Table.Td>
                            <Text size="xs" ff="monospace" c="dimmed">{truncate(p.user_id, 20)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={PLAN_COLORS[p.plan] ?? 'gray'} variant="light">{p.plan}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} c="green">{formatIDR(p.amount_paid)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" ff="monospace" c="dimmed">{p.midtrans_order_id ?? '—'}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          ) : (
            <Text c="dimmed">Click the Revenue tab to load data.</Text>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate Subscription"
        size="sm"
      >
        <Stack>
          <TextInput
            label="Clerk User ID"
            placeholder="user_2abc123…"
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.currentTarget.value }))}
            required
          />
          <Select
            label="Plan"
            data={PLANS}
            value={form.plan}
            onChange={(v) => setForm((f) => ({ ...f, plan: v ?? 'growth' }))}
            required
          />
          <NumberInput
            label="Duration (days)"
            min={1}
            value={form.days}
            onChange={(v) => setForm((f) => ({ ...f, days: typeof v === 'number' ? v : 30 }))}
          />
          <Button onClick={handleActivate} loading={activating} fullWidth mt="xs">
            Activate
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
