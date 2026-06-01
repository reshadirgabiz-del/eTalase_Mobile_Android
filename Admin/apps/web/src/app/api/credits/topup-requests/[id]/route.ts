import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendPushToUser } from '@/lib/expo-push';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const { data: req, error: fetchErr } = await db
    .from('credit_topup_requests')
    .select('user_id, amount_idr')
    .eq('id', id)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchErr || !req) {
    return NextResponse.json({ error: 'Topup request not found' }, { status: 404 });
  }

  // Fetch current balance
  const { data: existing } = await db
    .from('account_credits')
    .select('balance_idr')
    .eq('user_id', req.user_id)
    .maybeSingle();

  const newBalance = (existing?.balance_idr ?? 0) + req.amount_idr;

  // Upsert balance
  const { error: balanceErr } = await db
    .from('account_credits')
    .upsert(
      { user_id: req.user_id, balance_idr: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

  if (balanceErr) return NextResponse.json({ error: balanceErr.message }, { status: 500 });

  // Mark confirmed
  await db
    .from('credit_topup_requests')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', id);

  // Record transaction
  await db.from('credit_transactions').insert({
    user_id: req.user_id,
    amount_idr: req.amount_idr,
    type: 'topup',
    description: 'Top-up kredit akun',
    reference_id: id,
  });

  sendPushToUser(
    req.user_id,
    'Top-up Kredit Dikonfirmasi',
    `Top-up Rp ${req.amount_idr.toLocaleString('id-ID')} berhasil. Saldo baru: Rp ${newBalance.toLocaleString('id-ID')}`,
    { type: 'credit_topup_confirmed', amountIdr: req.amount_idr, newBalance },
  ).catch(() => {});

  return NextResponse.json({ ok: true, newBalance });
}
