import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();

  const [storesRes, subsRes, vouchersRes] = await Promise.all([
    db.from('stores').select('id', { count: 'exact', head: true }),
    db.from('subscriptions').select('status'),
    db.from('plan_vouchers').select('is_active'),
  ]);

  const byStatus = { active: 0, pending: 0, expired: 0, cancelled: 0 };
  for (const s of subsRes.data ?? []) {
    const k = s.status as keyof typeof byStatus;
    if (k in byStatus) byStatus[k]++;
  }

  const total = vouchersRes.data?.length ?? 0;
  const activeVouchers = vouchersRes.data?.filter((v) => v.is_active).length ?? 0;

  return NextResponse.json({
    stores: storesRes.count ?? 0,
    subscriptions: byStatus,
    vouchers: { total, active: activeVouchers },
  });
}
