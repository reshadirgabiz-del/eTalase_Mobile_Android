import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

// Supabase Database Webhook: INSERT on credit_refund_requests
export async function POST(req: NextRequest) {
  const authError = verifyWebhookSignature(req);
  if (authError) return authError;

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
