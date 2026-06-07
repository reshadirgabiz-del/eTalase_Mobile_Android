import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
  enterprise: 'Enterprise',
};

// Supabase Database Webhook: INSERT on subscriptions
// Only alerts for user-initiated purchases (status = 'pending').
// Admin-created subscriptions come in as 'active' and are skipped.
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

  if (record?.status !== 'pending') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const plan: string = record?.plan ?? 'unknown';
  const planLabel = PLAN_LABELS[plan] ?? plan;

  await sendPushToAdmins(
    'Pembelian Paket Baru',
    `Paket ${planLabel} menunggu konfirmasi pembayaran`,
    { type: 'new_subscription', subscriptionId: record?.id, plan, userId: record?.user_id },
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
