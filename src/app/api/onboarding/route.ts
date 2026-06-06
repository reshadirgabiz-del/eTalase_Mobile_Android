import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400, headers: CORS });
  }

  const db = createServerClient();
  const { data } = await db
    .from('onboarding_responses')
    .select('completed_at, credit_granted')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json(
    { completed: !!data?.completed_at, creditGranted: data?.credit_granted ?? false },
    { headers: CORS },
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400, headers: CORS });
  }

  const { userId, data = {}, completed = false, creditGranted = false } = body as {
    userId?: string;
    data?: Record<string, unknown>;
    completed?: boolean;
    creditGranted?: boolean;
  };

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId required' }, { status: 400, headers: CORS });
  }

  const db = createServerClient();

  const row: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...(data.name              !== undefined && { name: data.name }),
    ...(data.ageRange          !== undefined && { age_range: data.ageRange }),
    ...(data.isSelling         !== undefined && { is_selling: data.isSelling }),
    ...(data.sellingDuration   !== undefined && { selling_duration: data.sellingDuration }),
    ...(data.productCategory   !== undefined && { product_category: data.productCategory }),
    ...(data.topProductName    !== undefined && { top_product_name: data.topProductName }),
    ...(data.topProductCategory !== undefined && { top_product_category: data.topProductCategory }),
    ...(data.monthlyRevenue    !== undefined && { monthly_revenue: data.monthlyRevenue }),
    ...(data.productPrice      !== undefined && { product_price: data.productPrice }),
    ...(data.shopeeSellerType  !== undefined && { shopee_seller_type: data.shopeeSellerType }),
    ...(data.shopeeGratisOngkir !== undefined && { shopee_gratis_ongkir: data.shopeeGratisOngkir }),
    ...(data.shopeePromoXtra   !== undefined && { shopee_promo_xtra: data.shopeePromoXtra }),
    ...(data.tokopediaSellerType !== undefined && { tokopedia_seller_type: data.tokopediaSellerType }),
    ...(data.tokopediaIsPreOrder !== undefined && { tokopedia_is_pre_order: data.tokopediaIsPreOrder }),
    ...(creditGranted && { credit_granted: true }),
    ...(completed && { completed_at: new Date().toISOString() }),
  };

  const { error } = await db
    .from('onboarding_responses')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  // Grant 25k non-refundable promo credit — idempotent via credit_granted flag
  if (creditGranted) {
    const { data: existing } = await db
      .from('onboarding_responses')
      .select('credit_granted')
      .eq('user_id', userId)
      .maybeSingle();

    // Only grant once — check flag before the upsert above may have just set it
    if (!existing?.credit_granted || row.credit_granted) {
      // Check if a promo transaction already exists to avoid double-granting
      const { data: existingPromo } = await db
        .from('credit_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'promo')
        .maybeSingle();

      if (!existingPromo) {
        const { data: credits } = await db
          .from('account_credits')
          .select('balance_idr, promo_balance_idr')
          .eq('user_id', userId)
          .maybeSingle();

        const newBalance = (credits?.balance_idr ?? 0) + 25000;
        const newPromo = (credits?.promo_balance_idr ?? 0) + 25000;

        await db.from('account_credits').upsert(
          { user_id: userId, balance_idr: newBalance, promo_balance_idr: newPromo, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );

        await db.from('credit_transactions').insert({
          user_id: userId,
          amount_idr: 25000,
          type: 'promo',
          description: 'Bonus onboarding — tidak dapat direfund',
        });
      }
    }
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
