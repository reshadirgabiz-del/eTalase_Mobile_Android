import { AppShellLayout } from '@/components/AppShellLayout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
