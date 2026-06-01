import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const ALL_PLANS = ['free', 'starter', 'growth', 'business', 'enterprise'] as const;
type PlanKey = (typeof ALL_PLANS)[number];

const PLAN_DEFAULTS: Record<PlanKey, number | null> = {
  free: 0,
  starter: 150_000,
  growth: 300_000,
  business: 1_000_000,
  enterprise: null,
};

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from('plan_configs')
    .select('plan_key, config')
    .in('plan_key', ALL_PLANS as unknown as string[]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const configMap: Record<string, number | null> = {};
  for (const row of data ?? []) {
    if (row.config?.priceIdr !== undefined) {
      configMap[row.plan_key] = row.config.priceIdr;
    }
  }

  const result = ALL_PLANS.map((plan) => ({
    plan,
    price_idr: configMap[plan] !== undefined ? configMap[plan] : PLAN_DEFAULTS[plan],
  }));

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const { plan, price_idr } = await req.json();

  if (!plan || !(ALL_PLANS as readonly string[]).includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  if (plan === 'enterprise') {
    return NextResponse.json({ error: 'Enterprise pricing is contact-based and cannot be edited here' }, { status: 400 });
  }
  if (price_idr == null || price_idr < 0) {
    return NextResponse.json({ error: 'price_idr must be >= 0' }, { status: 400 });
  }

  const db = createServerClient();

  const { data: existing } = await db
    .from('plan_configs')
    .select('config')
    .eq('plan_key', plan)
    .maybeSingle();

  const merged = { ...(existing?.config ?? {}), priceIdr: price_idr };

  const { error } = await db
    .from('plan_configs')
    .upsert(
      { plan_key: plan, config: merged, updated_at: new Date().toISOString() },
      { onConflict: 'plan_key' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plan, price_idr });
}
