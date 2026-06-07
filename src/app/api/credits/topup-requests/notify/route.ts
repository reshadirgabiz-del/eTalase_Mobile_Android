import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';

// Called by a Supabase Database Webhook on INSERT into credit_topup_requests.
// Webhook payload: { type: "INSERT", record: { user_id, amount_idr, ... } }
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get('x-webhook-secret');
    if (signature !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

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
