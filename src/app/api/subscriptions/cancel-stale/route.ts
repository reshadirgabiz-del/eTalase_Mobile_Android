import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST() {
  const db = createServerClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);

  const { data, error } = await db
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .lt('created_at', cutoff.toISOString())
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cancelled: data?.length ?? 0 });
}
