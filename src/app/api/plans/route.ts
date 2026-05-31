import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const VALID_PLANS = ['starter', 'growth', 'business', 'enterprise'];

export async function GET() {
  const { data, error } = await createServerClient()
    .from('plan_prices')
    .select('*')
    .order('plan');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { plan, price_idr } = await req.json();

  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  if (price_idr == null || price_idr < 0) {
    return NextResponse.json({ error: 'price_idr must be >= 0' }, { status: 400 });
  }

  const { data, error } = await createServerClient()
    .from('plan_prices')
    .upsert({ plan, price_idr, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
