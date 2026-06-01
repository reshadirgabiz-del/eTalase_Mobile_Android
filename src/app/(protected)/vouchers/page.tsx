'use client';

import { useEffect, useState } from 'react';
import {
  Stack, Title, Group, Button, Table, Badge, ActionIcon, Text, Loader,
  Modal, TextInput, Select, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconTrash, IconPower } from '@tabler/icons-react';
import type { Plan, PlanVoucher } from '@/types';
import { formatDate, formatIDR } from '@/lib/utils';

const PLAN_COLORS: Record<Plan, string> = {
  starter: 'gray',
  growth: 'teal',
  business: 'blue',
  enterprise: 'violet',
};

export default function VouchersPage() {
  const [data, setData] = useState<PlanVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'absolute',
    value: 10 as number,
    maxUsages: '',
    expires: '',
    applicablePlan: null as Plan | null,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/vouchers');
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (code: string) => {
    const r = await fetch(`/api/vouchers/${code}`, { method: 'PATCH' });
    if (r.ok) {
      notifications.show({ color: 'teal', message: 'Voucher updated' });
      fetchData();
    } else {
      notifications.show({ color: 'red', message: 'Failed to update voucher' });
    }
  };

  const handleDelete = (code: string) => {
    modals.openConfirmModal({
      title: `Delete voucher "${code}"?`,
      children: <Text size="sm">This action cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const r = await fetch(`/api/vouchers/${code}`, { method: 'DELETE' });
        if (r.ok) {
          notifications.show({ color: 'green', message: 'Voucher deleted' });
          fetchData();
        } else {
          const err = await r.json();
          notifications.show({ color: 'red', message: err.error ?? 'Error' });
        }
      },
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const r = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: form.value,
          maxUsages: form.maxUsages ? Number(form.maxUsages) : undefined,
          expires: form.expires || undefined,
          applicablePlan: form.applicablePlan ?? undefined,
        }),
      });
      const result = await r.json();
      if (!r.ok) {
        notifications.show({ color: 'red', message: result.error ?? 'Error' });
        return;
      }
      notifications.show({ color: 'green', message: `Voucher ${result.code} created` });
      setCreateOpen(false);
      setForm({ code: '', type: 'percent', value: 10, maxUsages: '', expires: '', applicablePlan: null });
      fetchData();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Plan Vouchers</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
          Create Voucher
        </Button>
      </Group>

      {loading ? (
        <Loader />
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Discount</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Used / Max</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center" py="md">
                      No vouchers found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                data.map((v) => (
                  <Table.Tr key={v.id}>
                    <Table.Td>
                      <Text fw={600} ff="monospace">
                        {v.code}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="cyan" variant="light">
                        {v.discount_type === 'percent'
                          ? `${v.discount_value}%`
                          : formatIDR(v.discount_value)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {v.applicable_plan ? (
                        <Badge color={PLAN_COLORS[v.applicable_plan]} variant="light" tt="capitalize">
                          {v.applicable_plan}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">All plans</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {v.current_usages} / {v.max_usages ?? '∞'}
                    </Table.Td>
                    <Table.Td>{formatDate(v.expires_at)}</Table.Td>
                    <Table.Td>
                      <Badge color={v.is_active ? 'green' : 'red'} variant="dot">
                        {v.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(v.created_at)}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          color={v.is_active ? 'orange' : 'green'}
                          onClick={() => handleToggle(v.code)}
                          title={v.is_active ? 'Disable' : 'Enable'}
                        >
                          <IconPower size={15} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(v.code)}
                          title="Delete"
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Plan Voucher"
        size="sm"
      >
        <Stack>
          <TextInput
            label="Code"
            placeholder="WELCOME20"
            value={form.code}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setForm((f) => ({ ...f, code: val.toUpperCase() }));
            }}
            required
          />
          <Select
            label="Discount Type"
            data={[
              { value: 'percent', label: 'Percentage (%)' },
              { value: 'absolute', label: 'Fixed Amount (IDR)' },
            ]}
            value={form.type}
            onChange={(v) =>
              setForm((f) => ({ ...f, type: (v ?? 'percent') as 'percent' | 'absolute' }))
            }
          />
          <NumberInput
            label={form.type === 'percent' ? 'Discount (%)' : 'Discount (IDR)'}
            min={0}
            max={form.type === 'percent' ? 100 : undefined}
            value={form.value}
            onChange={(v) => setForm((f) => ({ ...f, value: typeof v === 'number' ? v : 10 }))}
            required
          />
          <Select
            label="Applicable Plan"
            description="Leave blank to apply to all plans"
            data={[
              { value: 'starter', label: 'Starter' },
              { value: 'growth', label: 'Growth' },
              { value: 'business', label: 'Business' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            value={form.applicablePlan}
            onChange={(v) => setForm((f) => ({ ...f, applicablePlan: (v as Plan | null) }))}
            clearable
            placeholder="All plans"
          />
          <TextInput
            label="Max Usages"
            placeholder="Leave blank for unlimited"
            value={form.maxUsages}
            onChange={(e) => { const val = e.currentTarget.value; setForm((f) => ({ ...f, maxUsages: val })); }}
          />
          <TextInput
            label="Expiry Date"
            placeholder="YYYY-MM-DD (optional)"
            value={form.expires}
            onChange={(e) => { const val = e.currentTarget.value; setForm((f) => ({ ...f, expires: val })); }}
          />
          <Button onClick={handleCreate} loading={creating} fullWidth mt="xs">
            Create
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
