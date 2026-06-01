'use client';

import { useEffect, useState } from 'react';
import {
  Stack, Title, SimpleGrid, Paper, Text, Badge, Group, ActionIcon,
  Loader, Modal, NumberInput, Button, TextInput, Textarea, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil } from '@tabler/icons-react';
import type { PlanPrice, Plan } from '@/types';
import { formatIDR } from '@/lib/utils';

type BillingSettings = {
  bankName: string;
  bankAccountNumber: string;
  bankRecipientName: string;
  bankInstructions: string;
};

const TRANSFER_TEMPLATE =
  'Transfer tepat sejumlah yang tertera. Setelah transfer, konfirmasi ke info@mail.e-talase.com dengan menyertakan bukti transfer. Aktivasi paket maksimal 24 jam setelah konfirmasi diterima.';

const PLAN_COLORS: Record<Plan, string> = {
  starter: 'gray',
  growth: 'teal',
  business: 'blue',
  enterprise: 'violet',
};

const PLAN_ORDER: Plan[] = ['starter', 'growth', 'business', 'enterprise'];

export default function PlansPage() {
  const [data, setData] = useState<PlanPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<PlanPrice | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const [billing, setBilling] = useState<BillingSettings>({
    bankName: '',
    bankAccountNumber: '',
    bankRecipientName: '',
    bankInstructions: '',
  });
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingSaving, setBillingSaving] = useState(false);

  const resolvedMessage = billing.bankInstructions.trim()
    ? billing.bankInstructions.replace('{{template}}', TRANSFER_TEMPLATE)
    : TRANSFER_TEMPLATE;

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/plans');
      if (r.ok) setData(await r.json());
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load plans' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const r = await fetch('/api/billing');
      if (r.ok) setBilling(await r.json());
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load bank details' });
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => { fetchData(); fetchBilling(); }, []);

  const handleBillingSave = async () => {
    setBillingSaving(true);
    try {
      const r = await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: billing.bankName,
          bankAccountNumber: billing.bankAccountNumber,
          bankRecipientName: billing.bankRecipientName,
          bankInstructions: billing.bankInstructions,
        }),
      });
      const result = await r.json();
      if (!r.ok) {
        notifications.show({ color: 'red', message: result.error ?? 'Error' });
        return;
      }
      notifications.show({ color: 'green', message: 'Bank details saved' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to save bank details' });
    } finally {
      setBillingSaving(false);
    }
  };

  const openEdit = (row: PlanPrice) => {
    setEditTarget(row);
    setNewPrice(row.price_idr);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const r = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editTarget.plan, price_idr: newPrice }),
      });
      const result = await r.json();
      if (!r.ok) {
        notifications.show({ color: 'red', message: result.error ?? 'Error' });
        return;
      }
      notifications.show({ color: 'green', message: `${editTarget.plan} price updated` });
      setEditTarget(null);
      fetchData();
    } catch {
      notifications.show({ color: 'red', message: 'Failed to update price' });
    } finally {
      setSaving(false);
    }
  };

  const sorted = PLAN_ORDER.map((p) => data.find((d) => d.plan === p)).filter(Boolean) as PlanPrice[];

  return (
    <Stack>
      <Title order={3}>Plan Pricing</Title>
      <Text size="sm" c="dimmed">
        Set the subscription price for each plan. Changes take effect immediately for new checkouts.
      </Text>

      {loading ? (
        <Loader />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {sorted.map((row) => (
            <Paper key={row.plan} p="lg" withBorder radius="md">
              <Group justify="space-between" mb="xs">
                <Badge color={PLAN_COLORS[row.plan]} variant="light" size="lg" tt="capitalize">
                  {row.plan}
                </Badge>
                <ActionIcon variant="subtle" color="gray" onClick={() => openEdit(row)} title="Edit price">
                  <IconPencil size={16} />
                </ActionIcon>
              </Group>
              <Text size="xl" fw={700}>
                {row.price_idr === 0 ? 'Free' : formatIDR(row.price_idr)}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>per month</Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Paper p="lg" withBorder radius="md" mt="lg">
        <Stack gap="md">
          <Title order={4}>Bank Details (Manual Transfer)</Title>
          <Text size="sm" c="dimmed">
            Shown to users when they choose manual transfer at checkout.
          </Text>
          {billingLoading ? (
            <Loader size="sm" />
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                <TextInput
                  label="Bank Name"
                  placeholder="e.g. BCA"
                  value={billing.bankName}
                  onChange={(e) => { const v = e.currentTarget.value; setBilling((b) => ({ ...b, bankName: v })); }}
                />
                <TextInput
                  label="Account Number"
                  placeholder="e.g. 1234567890"
                  value={billing.bankAccountNumber}
                  onChange={(e) => { const v = e.currentTarget.value; setBilling((b) => ({ ...b, bankAccountNumber: v })); }}
                />
                <TextInput
                  label="Account Name"
                  placeholder="e.g. PT e-Talase"
                  value={billing.bankRecipientName}
                  onChange={(e) => { const v = e.currentTarget.value; setBilling((b) => ({ ...b, bankRecipientName: v })); }}
                />
              </SimpleGrid>
              <Textarea
                label="Custom Message"
                description={
                  <>
                    Shown below bank details. Leave blank to use the default template.
                    Use <strong>{'{{template}}'}</strong> anywhere to insert the default template text.
                  </>
                }
                placeholder="Leave blank to use default template…"
                minRows={3}
                value={billing.bankInstructions}
                onChange={(e) => { const v = e.currentTarget.value; setBilling((b) => ({ ...b, bankInstructions: v })); }}
              />
              {billing.bankInstructions.trim() && (
                <>
                  <Divider label="Preview (what users see)" labelPosition="left" />
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{resolvedMessage}</Text>
                </>
              )}
              <Button onClick={handleBillingSave} loading={billingSaving} style={{ alignSelf: 'flex-start' }}>
                Save Bank Details
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={
          editTarget ? (
            <Group gap="xs">
              <Text fw={600}>Edit price —</Text>
              <Badge color={PLAN_COLORS[editTarget.plan]} variant="light" tt="capitalize">
                {editTarget.plan}
              </Badge>
            </Group>
          ) : null
        }
        size="xs"
      >
        <Stack>
          <NumberInput
            label="Price (IDR)"
            description="Set to 0 for a free plan"
            min={0}
            step={1000}
            value={newPrice}
            onChange={(v) => setNewPrice(typeof v === 'number' ? v : 0)}
            required
          />
          <Button onClick={handleSave} loading={saving} fullWidth mt="xs">
            Save
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
