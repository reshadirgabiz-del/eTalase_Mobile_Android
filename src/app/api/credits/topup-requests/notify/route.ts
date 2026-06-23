import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

// Called by a Supabase Database Webhook on INSERT into credit_topup_requests.
// Webhook payload: { type: "INSERT", record: { user_id, amount_idr, ... } }
export async function POST(req: NextRequest) {
  const authError = verifyWebhookSignature(req);
  if (authError) return authError;

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const record = payload.record ?? payload;
  const amountIdr: number = record?.amount_idr ?? 0;

  await sendPushToAdmins(
    'Permintaan Top-up Baru',
    `Rp ${amountIdr.toLocaleString('id-ID')} menunggu konfirmasi`,
    { type: 'new_topup_request', record },
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
