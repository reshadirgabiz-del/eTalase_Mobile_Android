import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();
  const { data } = await db
    .from('account_credits')
    .select('user_id, balance_idr, updated_at')
    .order('balance_idr', { ascending: false });
  return NextResponse.json({ balances: data ?? [] });
}
