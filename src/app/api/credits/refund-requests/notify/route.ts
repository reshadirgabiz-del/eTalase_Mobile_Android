import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';

// Supabase Database Webhook: INSERT on credit_refund_requests
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
    'Permintaan Refund Baru',
    `Rp ${amountIdr.toLocaleString('id-ID')} menunggu persetujuan`,
    { type: 'new_refund_request', record },
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
