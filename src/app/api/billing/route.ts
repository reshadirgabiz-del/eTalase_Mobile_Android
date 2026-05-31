import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await createServerClient()
    .from('plan_configs')
    .select('config')
    .eq('plan_key', '_billing')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const config = data?.config ?? {};
  return NextResponse.json({
    bankName: config.bankName ?? '',
    bankAccountNumber: config.bankAccountNumber ?? '',
    bankRecipientName: config.bankRecipientName ?? '',
    bankInstructions: config.bankInstructions ?? '',
  });
}

export async function PATCH(req: NextRequest) {
  const updates = await req.json();

  const db = createServerClient();
  const { data: existing } = await db
    .from('plan_configs')
    .select('config')
    .eq('plan_key', '_billing')
    .maybeSingle();

  const merged = { ...(existing?.config ?? {}), ...updates };

  const { error } = await db.from('plan_configs').upsert(
    { plan_key: '_billing', config: merged, updated_at: new Date().toISOString() },
    { onConflict: 'plan_key' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
