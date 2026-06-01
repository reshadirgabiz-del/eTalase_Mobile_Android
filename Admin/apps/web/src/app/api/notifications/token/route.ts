import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db
    .from('admin_push_tokens')
    .upsert({ token }, { onConflict: 'token', ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const db = createServerClient();
  await db.from('admin_push_tokens').delete().eq('token', token);
  return NextResponse.json({ ok: true });
}
