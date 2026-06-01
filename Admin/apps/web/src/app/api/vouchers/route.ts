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

const VALID_PLANS = ['free', 'starter', 'growth', 'business', 'enterprise'];
const VALID_BILLING_CYCLES = ['monthly', 'annual'];

export async function POST(req: NextRequest) {
  const { code, type, value, maxUsages, expires, applicablePlan, applicableBillingCycle } = await req.json();

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
  if (applicableBillingCycle && !VALID_BILLING_CYCLES.includes(applicableBillingCycle)) {
    return NextResponse.json({ error: 'applicable_billing_cycle must be: monthly | annual' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    code: String(code).toUpperCase().trim(),
    discount_type: type,
    discount_value: Number(value),
  };
  if (maxUsages) payload.max_usages = Number(maxUsages);
  if (expires) payload.expires_at = new Date(expires).toISOString();
  if (applicablePlan) payload.applicable_plan = applicablePlan;
  if (applicableBillingCycle) payload.applicable_billing_cycle = applicableBillingCycle;

  const { data, error } = await createServerClient()
    .from('plan_vouchers')
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
