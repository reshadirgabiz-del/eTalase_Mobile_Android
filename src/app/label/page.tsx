'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Stack,
  Title,
  Paper,
  Text,
  Button,
  Group,
  Image,
  Loader,
  Alert,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconPhoto, IconAlertCircle } from '@tabler/icons-react';

export default function LabelPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchLogo = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/label');
      if (r.ok) {
        const json = await r.json();
        setLogoUrl(json.logoUrl ?? null);
      }
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load current logo' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogo(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      notifications.show({ color: 'red', message: 'Only SVG, PNG, JPG, or WebP files are supported' });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/label', { method: 'POST', body: form });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? 'Upload failed');
      setLogoUrl(json.logoUrl);
      notifications.show({ color: 'teal', message: 'Platform logo updated successfully' });
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message ?? 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Stack gap="lg">
      <Title order={3}>Shipping Label Assets</Title>

      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={600} size="sm">Platform Logo</Text>
              <Text size="xs" c="dimmed" mt={2}>
                Shown in the "Powered by" footer of every shipping label. Replaces the default e-talase SVG.
              </Text>
            </div>
            {!loading && (
              <Badge color={logoUrl ? 'teal' : 'gray'} variant="light">
                {logoUrl ? 'Custom' : 'Default (built-in SVG)'}
              </Badge>
            )}
          </Group>

          {loading ? (
            <Loader size="sm" />
          ) : logoUrl ? (
            <Paper withBorder p="md" radius="sm" bg="gray.0" style={{ display: 'inline-block' }}>
              <Image
                src={logoUrl}
                alt="Platform logo"
                h={60}
                w="auto"
                fit="contain"
                style={{ maxWidth: 240 }}
              />
            </Paper>
          ) : (
            <Alert icon={<IconPhoto size={16} />} color="gray" variant="light">
              No custom logo uploaded. The built-in e-talase SVG from <code>assets/logo.svg</code> is used.
            </Alert>
          )}

          <Group>
            <input
              ref={fileRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <Button
              leftSection={<IconUpload size={15} />}
              loading={uploading}
              onClick={() => fileRef.current?.click()}
              variant="light"
            >
              {logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </Button>
            {logoUrl && (
              <Text size="xs" c="dimmed">
                To revert to the built-in SVG, delete the{' '}
                <code>_label_assets</code> config from Supabase or clear the URL.
              </Text>
            )}
          </Group>

          <Alert icon={<IconAlertCircle size={15} />} color="blue" variant="light">
            Recommended: SVG or PNG with transparent background, at least 200×60 px. The logo is shown at ~50 px wide in the label footer.
          </Alert>
        </Stack>
      </Paper>

      <Paper withBorder p="lg" radius="md">
        <Stack gap="xs">
          <Text fw={600} size="sm">Courier Logos</Text>
          <Text size="xs" c="dimmed">
            Courier logos are read directly from <code>Backend/assets/couriers/</code>. To update a courier logo, replace the corresponding file (e.g. <code>jne.png</code>, <code>sicepat.png</code>) and restart the backend.
          </Text>
          <Text size="xs" c="dimmed">
            Supported couriers: anteraja, borzo, deliveree, gojek, grab, idexpress, jdl, jne, jnt, lalamove, lion, ninja, paxel, pos, rpx, sap, sentralcargo, sicepat, tiki, wahana.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
