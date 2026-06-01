'use client';

import { useEffect, useState } from 'react';
import {
  Stack, Title, Table, Text, Loader, ActionIcon, Modal, Code, ScrollArea,
} from '@mantine/core';
import { IconEye } from '@tabler/icons-react';

export default function MigrationsPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewFile, setViewFile] = useState<string | null>(null);
  const [sql, setSql] = useState('');
  const [loadingSql, setLoadingSql] = useState(false);

  useEffect(() => {
    fetch('/api/migrations')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) { setError(data.error); return; }
        if (Array.isArray(data)) setFiles(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (filename: string) => {
    setViewFile(filename);
    setLoadingSql(true);
    try {
      const r = await fetch(`/api/migrations/${encodeURIComponent(filename)}`);
      const data = await r.json();
      setSql(data.sql ?? data.error ?? 'Error loading file');
    } finally {
      setLoadingSql(false);
    }
  };

  return (
    <Stack>
      <Title order={3}>Migrations</Title>
      <Text size="sm" c="dimmed">
        SQL files from <Code>../supabase/migrations/</Code>
      </Text>

      {loading ? (
        <Loader />
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : (
        <Table.ScrollContainer minWidth={400}>
          <Table withTableBorder striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>#</Table.Th>
                <Table.Th>Filename</Table.Th>
                <Table.Th w={50} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {files.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text c="dimmed" ta="center" py="md">
                      No migration files found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                files.map((f, i) => (
                  <Table.Tr key={f}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {String(i + 1).padStart(2, '0')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {f}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon variant="subtle" color="teal" onClick={() => handleView(f)}>
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal
        opened={!!viewFile}
        onClose={() => setViewFile(null)}
        title={<Text ff="monospace" size="sm">{viewFile}</Text>}
        size="xl"
      >
        {loadingSql ? (
          <Loader m="md" />
        ) : (
          <ScrollArea h={480}>
            <Code block p="md" style={{ whiteSpace: 'pre', fontSize: 12 }}>
              {sql}
            </Code>
          </ScrollArea>
        )}
      </Modal>
    </Stack>
  );
}
