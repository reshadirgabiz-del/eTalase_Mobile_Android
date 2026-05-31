'use client';

import { useEffect, useState } from 'react';
import {
  Stack, Title, Text, Group, Button, Badge, Table, Loader,
  Tabs, Paper, Divider, CopyButton, Tooltip, ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { formatDate, formatIDR } from '@/lib/utils';

type TopupRequest = {
  id: string;
  user_id: string;
  amount_idr: number;
  unique_code: string;
  status: string;
  created_at: string;
};

type RefundRequest = {
  id: string;
  user_id: string;
  amount_idr: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  contact_email: string;
  message: string | null;
  status: string;
  created_at: string;
};

function CopyText({ value }: { value: string }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm" ff="monospace">{value}</Text>
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

export default function CreditsPage() {
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const r = await fetch('/api/credits');
      const data = await r.json();
      setTopups(data.topups ?? []);
      setRefunds(data.refunds ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const handleConfirmTopup = (id: string, amount: number) => {
    modals.openConfirmModal({
      title: 'Confirm topup?',
      children: <Text size="sm">Add <strong>{formatIDR(amount)}</strong> credits to this user's account?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        setConfirming(id);
        try {
          const r = await fetch(`/api/credits/topup-requests/${id}`, { method: 'POST' });
          const result = await r.json();
          if (r.ok) {
            notifications.show({ color: 'green', message: `Topup confirmed. New balance: ${formatIDR(result.newBalance)}` });
            fetchData();
          } else {
            notifications.show({ color: 'red', message: result.error ?? 'Error' });
          }
        } finally {
          setConfirming(null);
        }
      },
    });
  };

  const handleRefund = (id: string, amount: number, action: 'approve' | 'reject') => {
    modals.openConfirmModal({
      title: action === 'approve' ? 'Approve refund?' : 'Reject refund?',
      children: <Text size="sm">{action === 'approve' ? `This will deduct ${formatIDR(amount)} from the user's credit balance.` : 'This will mark the request as rejected.'}</Text>,
      labels: { confirm: action === 'approve' ? 'Approve' : 'Reject', cancel: 'Cancel' },
      confirmProps: { color: action === 'approve' ? 'blue' : 'red' },
      onConfirm: async () => {
        setProcessing(id);
        try {
          const r = await fetch(`/api/credits/refund-requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          });
          if (r.ok) {
            notifications.show({ color: 'green', message: `Refund ${action}d` });
            fetchData();
          } else {
            const err = await r.json();
            notifications.show({ color: 'red', message: err.error ?? 'Error' });
          }
        } finally {
          setProcessing(null);
        }
      },
    });
  };

  if (loading) return <Loader mt="xl" />;

  return (
    <Stack gap="xl">
      <Title order={3}>Credits</Title>

      <Tabs defaultValue="topups">
        <Tabs.List>
          <Tabs.Tab value="topups">
            Pending Topups {topups.length > 0 && <Badge size="xs" ml={4} color="yellow">{topups.length}</Badge>}
          </Tabs.Tab>
          <Tabs.Tab value="refunds">
            Pending Refunds {refunds.length > 0 && <Badge size="xs" ml={4} color="red">{refunds.length}</Badge>}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="topups" pt="md">
          {topups.length === 0 ? (
            <Text c="dimmed" size="sm">No pending topup requests.</Text>
          ) : (
            <Table striped withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User ID</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Unique Code</Table.Th>
                  <Table.Th>Requested</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {topups.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td><CopyText value={t.user_id} /></Table.Td>
                    <Table.Td><Text fw={600}>{formatIDR(t.amount_idr)}</Text></Table.Td>
                    <Table.Td>
                      <Badge ff="monospace" variant="light" color="orange">{t.unique_code}</Badge>
                    </Table.Td>
                    <Table.Td><Text size="sm">{formatDate(t.created_at)}</Text></Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        color="green"
                        loading={confirming === t.id}
                        onClick={() => handleConfirmTopup(t.id, t.amount_idr)}
                      >
                        Confirm
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="refunds" pt="md">
          {refunds.length === 0 ? (
            <Text c="dimmed" size="sm">No pending refund requests.</Text>
          ) : (
            <Stack gap="md">
              {refunds.map((r) => (
                <Paper key={r.id} p="md" withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={600}>{formatIDR(r.amount_idr)}</Text>
                      <Text size="xs" c="dimmed">{formatDate(r.created_at)}</Text>
                    </Group>
                    <Divider />
                    <Group gap="xl">
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">User ID</Text>
                        <CopyText value={r.user_id} />
                      </Stack>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Bank</Text>
                        <Text size="sm">{r.bank_name}</Text>
                      </Stack>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Account Number</Text>
                        <CopyText value={r.bank_account_number} />
                      </Stack>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Account Name</Text>
                        <Text size="sm">{r.bank_account_name}</Text>
                      </Stack>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Contact Email</Text>
                        <Text size="sm">{r.contact_email}</Text>
                      </Stack>
                    </Group>
                    {r.message && (
                      <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>"{r.message}"</Text>
                    )}
                    <Group gap="sm" mt="xs">
                      <Button size="xs" color="blue" loading={processing === r.id} onClick={() => handleRefund(r.id, r.amount_idr, 'approve')}>Approve</Button>
                      <Button size="xs" color="red" variant="light" loading={processing === r.id} onClick={() => handleRefund(r.id, r.amount_idr, 'reject')}>Reject</Button>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
