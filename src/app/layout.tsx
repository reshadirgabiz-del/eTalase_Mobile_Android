import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Providers } from './providers';
import { AppShellLayout } from '@/components/AppShellLayout';

export const metadata: Metadata = {
  title: 'Jastip Admin',
  description: 'Platform admin panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body style={{ margin: 0 }}>
        <Providers>
          <AppShellLayout>{children}</AppShellLayout>
        </Providers>
      </body>
    </html>
  );
}
