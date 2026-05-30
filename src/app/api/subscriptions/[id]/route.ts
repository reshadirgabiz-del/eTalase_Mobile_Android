import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = await req.json();

  if (!['expire', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'action must be: expire | cancel' }, { status: 400 });
  }

  const status = action === 'expire' ? 'expired' : 'cancelled';
  const { error } = await createServerClient().from('subscriptions').update({ status }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
