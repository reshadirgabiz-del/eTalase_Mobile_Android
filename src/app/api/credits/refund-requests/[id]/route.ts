import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendPushToUser } from '@/lib/expo-push';

const VALID_ACTIONS = ['approve', 'reject'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'action must be approve | reject' }, { status: 400 });
  }

  const db = createServerClient();

  const { data: refund, error: fetchErr } = await db
    .from('credit_refund_requests')
    .select('user_id, amount_idr')
    .eq('id', id)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchErr || !refund) {
    return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
  }

  if (action === 'approve') {
    // Deduct from balance (allow floor at 0 if somehow inconsistent)
    const { data: existing } = await db
      .from('account_credits')
      .select('balance_idr')
      .eq('user_id', refund.user_id)
      .maybeSingle();

    const newBalance = Math.max(0, (existing?.balance_idr ?? 0) - refund.amount_idr);

    await db
      .from('account_credits')
      .upsert(
        { user_id: refund.user_id, balance_idr: newBalance, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    await db.from('credit_transactions').insert({
      user_id: refund.user_id,
      amount_idr: -refund.amount_idr,
      type: 'refund',
      description: 'Refund kredit akun',
      reference_id: id,
    });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  const { error } = await db
    .from('credit_refund_requests')
    .update({ status, processed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pushTitle = action === 'approve' ? 'Refund Disetujui' : 'Refund Ditolak';
  const pushBody =
    action === 'approve'
      ? `Refund Rp ${refund.amount_idr.toLocaleString('id-ID')} telah disetujui dan akan segera diproses.`
      : `Permintaan refund Rp ${refund.amount_idr.toLocaleString('id-ID')} ditolak. Hubungi admin untuk informasi lebih lanjut.`;
  sendPushToUser(refund.user_id, pushTitle, pushBody, {
    type: 'credit_refund_processed',
    action,
    amountIdr: refund.amount_idr,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
