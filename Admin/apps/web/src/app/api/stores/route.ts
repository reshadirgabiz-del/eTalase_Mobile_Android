import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();

  const { data: stores, error } = await db
    .from('stores')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!stores?.length) return NextResponse.json([]);

  const { data: members } = await db.from('store_members').select('store_id, role, user_id');

  const memberCounts = new Map<string, number>();
  const ownerByStore = new Map<string, string>();
  for (const m of members ?? []) {
    memberCounts.set(m.store_id, (memberCounts.get(m.store_id) ?? 0) + 1);
    if (m.role === 'owner' && m.user_id) ownerByStore.set(m.store_id, m.user_id);
  }

  const ownerIds = [...new Set(ownerByStore.values())];
  const { data: subs } = ownerIds.length
    ? await db
        .from('subscriptions')
        .select('user_id, plan, expires_at')
        .in('user_id', ownerIds)
        .eq('status', 'active')
    : { data: [] };

  const subByOwner = new Map<string, { plan: string; expires_at: string | null }>();
  for (const s of subs ?? []) subByOwner.set(s.user_id, s);

  const result = stores.map((store) => {
    const ownerId = ownerByStore.get(store.id);
    const sub = ownerId ? subByOwner.get(ownerId) : undefined;
    return {
      ...store,
      member_count: memberCounts.get(store.id) ?? 0,
      owner_id: ownerId ?? null,
      plan: sub?.plan ?? null,
      sub_expires_at: sub?.expires_at ?? null,
    };
  });

  return NextResponse.json(result);
}
