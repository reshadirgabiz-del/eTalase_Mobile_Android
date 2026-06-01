import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();
  const { data } = await db
    .from('credit_transactions')
    .select('id, user_id, amount_idr, type, description, reference_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  return NextResponse.json({ transactions: data ?? [] });
}
