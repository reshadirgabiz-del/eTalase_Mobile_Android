import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createServerClient();

  const { data: existing, error: fetchErr } = await db
    .from('plan_vouchers')
    .select('id, is_active')
    .ilike('code', code)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

  const { error } = await db
    .from('plan_vouchers')
    .update({ is_active: !existing.is_active })
    .eq('id', existing.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ is_active: !existing.is_active });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createServerClient();

  const { data: existing } = await db
    .from('plan_vouchers')
    .select('id')
    .ilike('code', code)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

  const { error } = await db.from('plan_vouchers').delete().eq('id', existing.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
