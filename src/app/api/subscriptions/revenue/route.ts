import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();

  const { data: payments, error } = await db
    .from('subscriptions')
    .select('id, user_id, plan, amount_paid, midtrans_order_id, created_at')
    .eq('status', 'active')
    .not('amount_paid', 'is', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = payments ?? [];
  const totalRevenue = list.reduce((sum: number, p) => sum + (p.amount_paid ?? 0), 0);

  const byPlan: Record<string, { count: number; total: number }> = {};
  for (const p of list) {
    if (!byPlan[p.plan]) byPlan[p.plan] = { count: 0, total: 0 };
    byPlan[p.plan].count++;
    byPlan[p.plan].total += p.amount_paid ?? 0;
  }

  return NextResponse.json({ totalRevenue, byPlan, payments: list });
}
