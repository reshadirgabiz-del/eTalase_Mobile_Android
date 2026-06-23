import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

// Supabase Database Webhook: INSERT on stores
export async function POST(req: NextRequest) {
  const authError = verifyWebhookSignature(req);
  if (authError) return authError;

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const record = payload.record ?? payload;
  const storeName: string = record?.name ?? 'Toko baru';

  await sendPushToAdmins(
    'Toko Baru Dibuka',
    `"${storeName}" baru saja bergabung`,
    { type: 'new_store', storeId: record?.id, storeName },
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
