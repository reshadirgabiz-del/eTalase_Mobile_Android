import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const VALID_PLANS = ['starter', 'growth', 'business', 'enterprise'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');

  const db = createServerClient();
  let query = db.from('subscriptions').select('*').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (userId) query = query.ilike('user_id', `%${userId}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId, plan, days = 30 } = await req.json();

  if (!userId || !plan) return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 });
  if (!VALID_PLANS.includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(days));

  const db = createServerClient();

  const { data: existing } = await db
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = { plan, status: 'active', expires_at: expiresAt.toISOString() };

  const result = existing
    ? await db.from('subscriptions').update(payload).eq('id', existing.id).select().single()
    : await db.from('subscriptions').insert({ user_id: userId, ...payload }).select().single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data);
}
