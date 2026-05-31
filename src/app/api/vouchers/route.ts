import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await createServerClient()
    .from('plan_vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const VALID_PLANS = ['starter', 'growth', 'business', 'enterprise'];

export async function POST(req: NextRequest) {
  const { code, type, value, maxUsages, expires, applicablePlan } = await req.json();

  if (!code || !type || value == null) {
    return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
  }
  if (!['percent', 'absolute'].includes(type)) {
    return NextResponse.json({ error: 'type must be: percent | absolute' }, { status: 400 });
  }
  if (type === 'percent' && Number(value) > 100) {
    return NextResponse.json({ error: 'Percent discount cannot exceed 100' }, { status: 400 });
  }
  if (applicablePlan && !VALID_PLANS.includes(applicablePlan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    code: String(code).toUpperCase().trim(),
    discount_type: type,
    discount_value: Number(value),
  };
  if (maxUsages) payload.max_usages = Number(maxUsages);
  if (expires) payload.expires_at = new Date(expires).toISOString();
  if (applicablePlan) payload.applicable_plan = applicablePlan;

  const { data, error } = await createServerClient()
    .from('plan_vouchers')
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
