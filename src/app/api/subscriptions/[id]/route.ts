import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const VALID_ACTIONS = ['expire', 'cancel', 'confirm', 'archive'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: `action must be one of: ${VALID_ACTIONS.join(' | ')}` }, { status: 400 });
  }

  const db = createServerClient();

  if (action === 'confirm') {
    const amount_paid = body.amount_paid;
    if (typeof amount_paid !== 'number' || amount_paid <= 0) {
      return NextResponse.json({ error: 'amount_paid must be a positive number' }, { status: 400 });
    }
    const { error } = await db
      .from('subscriptions')
      .update({ status: 'active', amount_paid })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'archive') {
    const { error } = await db
      .from('subscriptions')
      .update({ is_archived: true })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const status = action === 'expire' ? 'expired' : 'cancelled';
  const { error } = await db.from('subscriptions').update({ status }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
