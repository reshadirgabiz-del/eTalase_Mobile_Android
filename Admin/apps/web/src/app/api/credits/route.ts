import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();
  const [topupsRes, refundsRes] = await Promise.all([
    db
      .from('credit_topup_requests')
      .select('id, user_id, amount_idr, unique_code, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    db
      .from('credit_refund_requests')
      .select('id, user_id, amount_idr, bank_name, bank_account_number, bank_account_name, contact_email, message, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    topups: topupsRes.data ?? [],
    refunds: refundsRes.data ?? [],
  });
}
