'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Stack, Title, Group, Button, TextInput, Select, Table, Badge,
  Menu, ActionIcon, Text, Loader, Modal, NumberInput, Tabs,
  SimpleGrid, Paper, Divider, Drawer, Switch, CopyButton, Tooltip,
  Anchor, Image,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  IconDots, IconCircleOff, IconX, IconPlus, IconSearch,
  IconTrash, IconCurrencyDollar, IconCheck, IconArchive, IconCopy,
  IconExternalLink,
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

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function canArchive(s: Subscription): boolean {
  return s.status === 'cancelled' || (s.status === 'active' && isExpiringSoon(s.expires_at));
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Text size="sm" c="dimmed" w={160} style={{ flexShrink: 0 }}>{label}</Text>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </Group>
  );
}

function CopyableText({ value }: { value: string }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>{value}</Text>
      <CopyButton value={value} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
            <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
              {copied ? <IconCheck size={10} /> : <IconCopy size={10} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [cancellingStale, setCancellingStale] = useState(false);
  const [form, setForm] = useState({ userId: '', plan: 'growth', days: 30 as number });

  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number | string>(0);
  const [confirming, setConfirming] = useState(false);
  const [archiving, setArchiving] = useState(false);

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
        if (!showArchived && s.is_archived) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        if (userFilter && !s.user_id.toLowerCase().includes(userFilter.toLowerCase())) return false;
        return true;
      }),
    [data, statusFilter, userFilter, showArchived],
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
          if (selectedSub?.id === id) setSelectedSub(null);
          fetchData();
        } else {
          const err = await r.json();
          notifications.show({ color: 'red', message: err.error ?? 'Error' });
        }
      },
    });
  };

  const handleConfirmPayment = async () => {
    if (!selectedSub) return;
    const amount = typeof confirmAmount === 'string' ? parseFloat(confirmAmount) : confirmAmount;
    if (!amount || amount <= 0) {
      notifications.show({ color: 'red', message: 'Enter a valid amount' });
      return;
    }
    setConfirming(true);
    try {
      const r = await fetch(`/api/subscriptions/${selectedSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', amount_paid: amount }),
      });
      if (r.ok) {
        notifications.show({ color: 'green', message: 'Payment confirmed — subscription activated' });
        setSelectedSub(null);
        fetchData();
      } else {
        const err = await r.json();
        notifications.show({ color: 'red', message: err.error ?? 'Error' });
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleArchive = async (id: string) => {
    setArchiving(true);
    try {
      const r = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });
      if (r.ok) {
        notifications.show({ color: 'teal', message: 'Subscription archived' });
        if (selectedSub?.id === id) setSelectedSub(null);
        fetchData();
      } else {
        const err = await r.json();
        notifications.show({ color: 'red', message: err.error ?? 'Error' });
      }
    } finally {
      setArchiving(false);
    }
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
                <Switch
                  label="Show archived"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.currentTarget.checked)}
                  size="sm"
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
                <Table striped highlightOnHover withTableBorder style={{ cursor: 'pointer' }}>
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
                        <Table.Tr
                          key={s.id}
                          onClick={() => { setSelectedSub(s); setConfirmAmount(0); }}
                          style={{ opacity: s.is_archived ? 0.5 : 1 }}
                        >
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
                            <Group gap={4}>
                              <Badge color={STATUS_COLORS[s.status] ?? 'gray'}>{s.status}</Badge>
                              {isExpiringSoon(s.expires_at) && s.status === 'active' && (
                                <Badge color="orange" variant="dot" size="sm">expiring soon</Badge>
                              )}
                              {s.is_archived && (
                                <Badge color="gray" variant="outline" size="sm">archived</Badge>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>{formatDate(s.expires_at)}</Table.Td>
                          <Table.Td>{formatDate(s.created_at)}</Table.Td>
                          <Table.Td onClick={(e) => e.stopPropagation()}>
                            {(s.status === 'active' || s.status === 'pending') && !s.is_archived && (
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
                                  {canArchive(s) && (
                                    <Menu.Item
                                      color="gray"
                                      leftSection={<IconArchive size={14} />}
                                      onClick={() => handleArchive(s.id)}
                                    >
                                      Archive
                                    </Menu.Item>
                                  )}
                                </Menu.Dropdown>
                              </Menu>
                            )}
                            {canArchive(s) && !s.is_archived && s.status === 'cancelled' && (
                              <Tooltip label="Archive">
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  onClick={() => handleArchive(s.id)}
                                  loading={archiving}
                                >
                                  <IconArchive size={16} />
                                </ActionIcon>
                              </Tooltip>
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

      {/* Subscription Detail Drawer */}
      <Drawer
        opened={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title="Subscription Details"
        position="right"
        size="md"
        padding="lg"
      >
        {selectedSub && (
          <Stack gap="md">
            <Group>
              <Badge color={PLAN_COLORS[selectedSub.plan] ?? 'gray'} size="lg" variant="light">
                {selectedSub.plan}
              </Badge>
              <Badge color={STATUS_COLORS[selectedSub.status] ?? 'gray'} size="lg">
                {selectedSub.status}
              </Badge>
              {isExpiringSoon(selectedSub.expires_at) && selectedSub.status === 'active' && (
                <Badge color="orange" variant="dot">expiring soon</Badge>
              )}
              {selectedSub.is_archived && (
                <Badge color="gray" variant="outline">archived</Badge>
              )}
            </Group>

            <Divider />

            <Stack gap="xs">
              <DetailRow label="Subscription ID">
                <CopyableText value={selectedSub.id} />
              </DetailRow>
              <DetailRow label="User ID">
                <CopyableText value={selectedSub.user_id} />
              </DetailRow>
            </Stack>

            <Divider />

            <Stack gap="xs">
              <DetailRow label="Amount Paid">
                {selectedSub.amount_paid != null ? (
                  <Text size="sm" fw={600} c="green">{formatIDR(selectedSub.amount_paid)}</Text>
                ) : (
                  <Text size="sm" c="dimmed">—</Text>
                )}
              </DetailRow>
              <DetailRow label="Order ID">
                <Text size="sm" ff="monospace">
                  {selectedSub.midtrans_order_id ?? '—'}
                </Text>
              </DetailRow>
              {selectedSub.payment_proof_url && (
                <>
                  <DetailRow label="Payment Proof">
                    <Anchor href={selectedSub.payment_proof_url} target="_blank" size="sm">
                      <Group gap={4}>
                        View proof <IconExternalLink size={12} />
                      </Group>
                    </Anchor>
                  </DetailRow>
                  <Image
                    src={selectedSub.payment_proof_url}
                    alt="Payment proof"
                    radius="md"
                    mah={240}
                    fit="contain"
                    style={{ border: '1px solid var(--mantine-color-default-border)' }}
                  />
                </>
              )}
              {selectedSub.payment_proof_submitted_at && (
                <DetailRow label="Proof Submitted">
                  <Text size="sm">{formatDate(selectedSub.payment_proof_submitted_at)}</Text>
                </DetailRow>
              )}
            </Stack>

            <Divider />

            <Stack gap="xs">
              <DetailRow label="Expires">
                <Text size="sm">{formatDate(selectedSub.expires_at)}</Text>
              </DetailRow>
              <DetailRow label="Created">
                <Text size="sm">{formatDate(selectedSub.created_at)}</Text>
              </DetailRow>
              <DetailRow label="Updated">
                <Text size="sm">{formatDate(selectedSub.updated_at)}</Text>
              </DetailRow>
            </Stack>

            {/* Confirm payment for pending (direct transfer) */}
            {selectedSub.status === 'pending' && !selectedSub.is_archived && (
              <>
                <Divider label="Confirm Direct Transfer Payment" labelPosition="left" />
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">
                    Verify the payment proof above, then enter the amount received to activate this subscription.
                  </Text>
                  <Group align="flex-end">
                    <NumberInput
                      label="Amount received (IDR)"
                      placeholder="e.g. 299000"
                      value={confirmAmount}
                      onChange={setConfirmAmount}
                      min={1}
                      thousandSeparator="."
                      decimalSeparator=","
                      style={{ flex: 1 }}
                    />
                    <Button
                      color="green"
                      leftSection={<IconCheck size={14} />}
                      onClick={handleConfirmPayment}
                      loading={confirming}
                    >
                      Confirm Payment
                    </Button>
                  </Group>
                </Stack>
              </>
            )}

            {/* Danger zone actions */}
            {!selectedSub.is_archived && (
              <>
                <Divider label="Actions" labelPosition="left" />
                <Group>
                  {(selectedSub.status === 'active' || selectedSub.status === 'pending') && (
                    <>
                      <Button
                        variant="light"
                        color="orange"
                        size="sm"
                        leftSection={<IconCircleOff size={14} />}
                        onClick={() => handleAction(selectedSub.id, 'expire')}
                      >
                        Expire
                      </Button>
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        leftSection={<IconX size={14} />}
                        onClick={() => handleAction(selectedSub.id, 'cancel')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {canArchive(selectedSub) && (
                    <Button
                      variant="light"
                      color="gray"
                      size="sm"
                      leftSection={<IconArchive size={14} />}
                      onClick={() => handleArchive(selectedSub.id)}
                      loading={archiving}
                    >
                      Archive
                    </Button>
                  )}
                </Group>
              </>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Activate Subscription Modal */}
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
