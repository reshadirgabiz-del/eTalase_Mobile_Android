'use client';

import { use, useEffect, useState } from 'react';
import {
  Stack, Title, Group, Text, Loader, Paper, Badge, Table, Anchor,
  Breadcrumbs, Tabs, Modal, Divider, SimpleGrid,
} from '@mantine/core';
import Link from 'next/link';
import type { StoreMember, Subscription, PromoCode, Order, Product } from '@/types';
import { formatDate, truncate, formatIDR } from '@/lib/utils';

type StoreDetail = {
  store: { id: string; name: string; logo_url: string | null; created_at: string };
  members: StoreMember[];
  subscriptions: Subscription[];
  promo_codes: PromoCode[];
  orders: Order[];
  products: Product[];
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'violet',
  admin: 'blue',
  delivery: 'teal',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  pending: 'yellow',
  expired: 'red',
  cancelled: 'gray',
  paid: 'green',
  processing: 'blue',
  shipped: 'indigo',
  delivered: 'teal',
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'gray',
  growth: 'teal',
  business: 'blue',
  enterprise: 'violet',
};

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<StoreMember | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetch(`/api/stores/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) { setError(d.error); return; }
        setDetail(d);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader mt="xl" />;
  if (error) return <Text c="red">{error}</Text>;
  if (!detail) return null;

  const { store, members, subscriptions, promo_codes, orders, products } = detail;

  return (
    <Stack>
      <Breadcrumbs>
        <Anchor component={Link} href="/stores" size="sm">
          Stores
        </Anchor>
        <Text size="sm">{store.name}</Text>
      </Breadcrumbs>

      <Title order={3}>{store.name}</Title>

      <Paper p="md" withBorder radius="md">
        <Group gap="xl">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Store ID</Text>
            <Text size="sm" ff="monospace">{store.id}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Created</Text>
            <Text size="sm">{formatDate(store.created_at)}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Members</Text>
            <Text size="sm">{members.length}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Products</Text>
            <Text size="sm">{products.length}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Orders</Text>
            <Text size="sm">{orders.length}</Text>
          </Stack>
        </Group>
      </Paper>

      <Tabs defaultValue="members">
        <Tabs.List>
          <Tabs.Tab value="members">Members ({members.length})</Tabs.Tab>
          <Tabs.Tab value="products">Products ({products.length})</Tabs.Tab>
          <Tabs.Tab value="orders">Orders ({orders.length})</Tabs.Tab>
          <Tabs.Tab value="promo_codes">Promo Codes ({promo_codes.length})</Tabs.Tab>
          <Tabs.Tab value="subscriptions">Subscriptions ({subscriptions.length})</Tabs.Tab>
        </Tabs.List>

        {/* Members Tab */}
        <Tabs.Panel value="members" pt="md">
          <Table.ScrollContainer minWidth={480}>
            <Table withTableBorder striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>User ID</Table.Th>
                  <Table.Th>Invite Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed" ta="center" py="md">No members</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  members.map((m) => (
                    <Table.Tr
                      key={m.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedMember(m)}
                    >
                      <Table.Td>{m.email}</Table.Td>
                      <Table.Td>
                        <Badge color={ROLE_COLORS[m.role] ?? 'gray'} variant="light">
                          {m.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" ff="monospace" c="dimmed">
                          {m.user_id ? truncate(m.user_id, 20) : '(pending)'}
                        </Text>
                      </Table.Td>
                      <Table.Td>{m.invitation_status ?? 'accepted'}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Tabs.Panel>

        {/* Products Tab */}
        <Tabs.Panel value="products" pt="md">
          <Table.ScrollContainer minWidth={480}>
            <Table withTableBorder striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed" ta="center" py="md">No products</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  products.map((p) => (
                    <Table.Tr
                      key={p.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedProduct(p)}
                    >
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td>{formatIDR(p.price)}</Table.Td>
                      <Table.Td>
                        <Badge color={p.is_archived ? 'gray' : 'green'} variant="dot">
                          {p.is_archived ? 'Archived' : 'Active'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatDate(p.created_at)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Tabs.Panel>

        {/* Orders Tab */}
        <Tabs.Panel value="orders" pt="md">
          <Table.ScrollContainer minWidth={600}>
            <Table withTableBorder striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Recipient</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Payment</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text c="dimmed" ta="center" py="md">No orders</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  orders.map((o) => (
                    <Table.Tr
                      key={o.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedOrder(o)}
                    >
                      <Table.Td>
                        <Text size="xs" ff="monospace" c="dimmed">{truncate(o.id)}</Text>
                      </Table.Td>
                      <Table.Td>{o.recipient_name}</Table.Td>
                      <Table.Td>{formatIDR(o.total)}</Table.Td>
                      <Table.Td>
                        <Badge color={STATUS_COLORS[o.status] ?? 'gray'}>{o.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="gray">{o.payment_method}</Badge>
                      </Table.Td>
                      <Table.Td>{formatDate(o.created_at)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Tabs.Panel>

        {/* Promo Codes Tab */}
        <Tabs.Panel value="promo_codes" pt="md">
          <Table.ScrollContainer minWidth={560}>
            <Table withTableBorder striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Discount</Table.Th>
                  <Table.Th>Applies To</Table.Th>
                  <Table.Th>Used / Max</Table.Th>
                  <Table.Th>Active</Table.Th>
                  <Table.Th>Expires</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {promo_codes.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text c="dimmed" ta="center" py="md">No promo codes</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  promo_codes.map((p) => (
                    <Table.Tr
                      key={p.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedPromo(p)}
                    >
                      <Table.Td>
                        <Text fw={600} ff="monospace">{p.code}</Text>
                      </Table.Td>
                      <Table.Td>
                        {p.discount_type === 'percent'
                          ? `${p.discount_value}%`
                          : formatIDR(p.discount_value)}
                      </Table.Td>
                      <Table.Td>{p.applies_to}</Table.Td>
                      <Table.Td>
                        {p.current_usages} / {p.max_usages ?? '∞'}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={p.is_active ? 'green' : 'red'} variant="dot">
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatDate(p.expires_at)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Tabs.Panel>

        {/* Subscriptions Tab */}
        <Tabs.Panel value="subscriptions" pt="md">
          {subscriptions.length === 0 ? (
            <Text c="dimmed" py="md">No subscription history</Text>
          ) : (
            <Table.ScrollContainer minWidth={480}>
              <Table withTableBorder striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Plan</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Amount Paid</Table.Th>
                    <Table.Th>Expires</Table.Th>
                    <Table.Th>Created</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {subscriptions.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>
                        <Text size="xs" c="dimmed" ff="monospace">{truncate(s.id)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={PLAN_COLORS[s.plan] ?? 'gray'} variant="light">{s.plan}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={STATUS_COLORS[s.status] ?? 'gray'}>{s.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {s.amount_paid ? (
                          <Text fw={600} c="green">{formatIDR(s.amount_paid)}</Text>
                        ) : (
                          <Text c="dimmed" size="sm">—</Text>
                        )}
                      </Table.Td>
                      <Table.Td>{formatDate(s.expires_at)}</Table.Td>
                      <Table.Td>{formatDate(s.created_at)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Member Detail Modal */}
      <Modal
        opened={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Member Details"
        size="sm"
      >
        {selectedMember && (
          <Stack gap="xs">
            <DetailRow label="Email" value={selectedMember.email} />
            <DetailRow label="Role">
              <Badge color={ROLE_COLORS[selectedMember.role] ?? 'gray'} variant="light">
                {selectedMember.role}
              </Badge>
            </DetailRow>
            <DetailRow label="User ID" value={selectedMember.user_id ?? '(pending)'} mono />
            <DetailRow label="Invite Status" value={selectedMember.invitation_status ?? 'accepted'} />
            <DetailRow label="Member Since" value={formatDate(selectedMember.created_at)} />
          </Stack>
        )}
      </Modal>

      {/* Promo Code Detail Modal */}
      <Modal
        opened={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title="Promo Code Details"
        size="sm"
      >
        {selectedPromo && (
          <Stack gap="xs">
            <DetailRow label="Code">
              <Text fw={700} ff="monospace" size="lg">{selectedPromo.code}</Text>
            </DetailRow>
            <DetailRow
              label="Discount"
              value={selectedPromo.discount_type === 'percent'
                ? `${selectedPromo.discount_value}%`
                : formatIDR(selectedPromo.discount_value)}
            />
            <DetailRow label="Type" value={selectedPromo.discount_type} />
            <DetailRow label="Applies To" value={selectedPromo.applies_to} />
            <DetailRow label="Usages" value={`${selectedPromo.current_usages} / ${selectedPromo.max_usages ?? '∞'}`} />
            <DetailRow label="Status">
              <Badge color={selectedPromo.is_active ? 'green' : 'red'} variant="dot">
                {selectedPromo.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </DetailRow>
            <DetailRow label="Expires" value={formatDate(selectedPromo.expires_at)} />
            <DetailRow label="Created" value={formatDate(selectedPromo.created_at)} />
          </Stack>
        )}
      </Modal>

      {/* Product Detail Modal */}
      <Modal
        opened={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
        size="sm"
      >
        {selectedProduct && (
          <Stack gap="xs">
            <DetailRow label="Name" value={selectedProduct.name} />
            <DetailRow label="Price" value={formatIDR(selectedProduct.price)} />
            <DetailRow label="Status">
              <Badge color={selectedProduct.is_archived ? 'gray' : 'green'} variant="dot">
                {selectedProduct.is_archived ? 'Archived' : 'Active'}
              </Badge>
            </DetailRow>
            <DetailRow label="Product ID" value={selectedProduct.id} mono />
            <DetailRow label="Created" value={formatDate(selectedProduct.created_at)} />
          </Stack>
        )}
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        opened={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        size="md"
      >
        {selectedOrder && (
          <Stack gap="xs">
            <DetailRow label="Order ID" value={selectedOrder.id} mono />
            <DetailRow label="Status">
              <Badge color={STATUS_COLORS[selectedOrder.status] ?? 'gray'}>{selectedOrder.status}</Badge>
            </DetailRow>
            <DetailRow label="Payment" value={selectedOrder.payment_method} />
            <Divider my="xs" label="Recipient" labelPosition="left" />
            <DetailRow label="Name" value={selectedOrder.recipient_name} />
            <DetailRow label="Phone" value={selectedOrder.phone} />
            <DetailRow label="City" value={selectedOrder.city} />
            <DetailRow label="Province" value={selectedOrder.province} />
            <Divider my="xs" label="Pricing" labelPosition="left" />
            <SimpleGrid cols={3} spacing="xs">
              <Paper p="xs" withBorder radius="sm">
                <Text size="xs" c="dimmed">Subtotal</Text>
                <Text size="sm" fw={600}>{formatIDR(selectedOrder.subtotal)}</Text>
              </Paper>
              <Paper p="xs" withBorder radius="sm">
                <Text size="xs" c="dimmed">Delivery</Text>
                <Text size="sm" fw={600}>{formatIDR(selectedOrder.delivery_price)}</Text>
              </Paper>
              <Paper p="xs" withBorder radius="sm">
                <Text size="xs" c="dimmed">Total</Text>
                <Text size="sm" fw={700} c="blue">{formatIDR(selectedOrder.total)}</Text>
              </Paper>
            </SimpleGrid>
            <DetailRow label="Created" value={formatDate(selectedOrder.created_at)} />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-start">
      <Text size="sm" c="dimmed" w={110}>{label}</Text>
      {children ?? (
        <Text size="sm" ff={mono ? 'monospace' : undefined} style={{ flex: 1, textAlign: 'right' }}>
          {value ?? '—'}
        </Text>
      )}
    </Group>
  );
}
