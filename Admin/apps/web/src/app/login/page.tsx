'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Center, Paper, Title, PasswordInput, Button, Stack, Text, ThemeIcon, Group,
} from '@mantine/core';
import { IconBuildingStore } from '@tabler/icons-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center h="100vh" bg="gray.1">
      <Paper p="xl" radius="md" withBorder w={340} shadow="sm">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Group justify="center" gap="xs">
              <ThemeIcon size="lg" variant="filled" radius="md" color="teal">
                <IconBuildingStore size={18} />
              </ThemeIcon>
              <Title order={4}>Jastip Admin</Title>
            </Group>

            <PasswordInput
              label="Password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />

            {error && (
              <Text size="sm" c="red">
                {error}
              </Text>
            )}

            <Button type="submit" loading={loading} fullWidth color="teal">
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
