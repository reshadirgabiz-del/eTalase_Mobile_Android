'use client';

import { useEffect, useState } from 'react';
import { Stack, Title, Table, Badge, Text, Loader, Anchor } from '@mantine/core';
import Link from 'next/link';
import type { StoreListRow } from '@/types';
import { formatDate, truncate } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  starter: 'gray',
  growth: 'teal',
  business: 'blue',
  enterprise: 'violet',
};

export default function StoresPage() {
  const [data, setData] = useState<StoreListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack>
      <Title order={3}>Stores</Title>

      {loading ? (
        <Loader />
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Sub Expires</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No stores found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                data.map((store) => (
                  <Table.Tr key={store.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed" ff="monospace">
                        {truncate(store.id)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Anchor component={Link} href={`/stores/${store.id}`} fw={600}>
                        {store.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{store.member_count}</Table.Td>
                    <Table.Td>
                      {store.plan ? (
                        <Badge color={PLAN_COLORS[store.plan] ?? 'gray'} variant="light">
                          {store.plan}
                        </Badge>
                      ) : (
                        <Text c="dimmed" size="sm">
                          none
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>{store.plan ? formatDate(store.sub_expires_at) : '—'}</Table.Td>
                    <Table.Td>{formatDate(store.created_at)}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
