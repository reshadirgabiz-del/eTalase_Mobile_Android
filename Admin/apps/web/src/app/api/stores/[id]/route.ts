import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const { data: store, error } = await db.from('stores').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  const [membersRes, promoRes, ordersRes, productsRes] = await Promise.all([
    db.from('store_members').select('*').eq('store_id', id).order('role'),
    db.from('promo_codes').select('*').eq('store_id', id).order('created_at', { ascending: false }),
    db.from('orders').select('id, status, subtotal, delivery_price, total, recipient_name, phone, city, province, payment_method, is_archived, created_at').eq('store_id', id).order('created_at', { ascending: false }).limit(100),
    db.from('products').select('id, name, price, is_archived, created_at').eq('store_id', id).order('created_at', { ascending: false }),
  ]);

  const owner = membersRes.data?.find((m) => m.role === 'owner' && m.user_id);
  const subscriptions = owner?.user_id
    ? (
        await db
          .from('subscriptions')
          .select('*')
          .eq('user_id', owner.user_id)
          .order('created_at', { ascending: false })
          .limit(10)
      ).data ?? []
    : [];

  return NextResponse.json({
    store,
    members: membersRes.data ?? [],
    subscriptions,
    promo_codes: promoRes.data ?? [],
    orders: ordersRes.data ?? [],
    products: productsRes.data ?? [],
  });
}
