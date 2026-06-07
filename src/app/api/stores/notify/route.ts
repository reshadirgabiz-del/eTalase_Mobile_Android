import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/expo-push';

// Supabase Database Webhook: INSERT on stores
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
  const storeName: string = record?.name ?? 'Toko baru';

  await sendPushToAdmins(
    'Toko Baru Dibuka',
    `"${storeName}" baru saja bergabung`,
    { type: 'new_store', storeId: record?.id, storeName },
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
