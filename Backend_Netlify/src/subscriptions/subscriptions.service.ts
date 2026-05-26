import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createHash } from 'crypto';
import { Snap } from 'midtrans-client';
import { SupabaseService } from '../common/supabase/supabase.service';
import { PLAN_LIMITS, PLAN_PRICES, PLAN_DISPLAY, type PlanLimits } from './plans.constants';

@Injectable()
export class SubscriptionsService {
  private snap: Snap;

  constructor(private readonly supabase: SupabaseService) {
    this.snap = new Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  getPlans() {
    return Object.values(PLAN_DISPLAY);
  }

  async getMySubscription(userId: string) {
    const { data } = await this.supabase.client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const plan = PLAN_DISPLAY[data.plan];
    const limits = PLAN_LIMITS[data.plan];
    const isActive = data.status === 'active' && new Date(data.expires_at) > new Date();

    const storeCount = await this.getOwnedStoreCount(userId);

    return {
      id: data.id,
      plan: data.plan,
      planDisplay: plan,
      limits,
      status: isActive ? 'active' : data.status,
      expiresAt: data.expires_at,
      midtransToken: data.midtrans_token,
      usage: { storeCount },
    };
  }

  async getActivePlan(userId: string): Promise<string | null> {
    const { data } = await this.supabase.client
      .from('subscriptions')
      .select('plan, expires_at, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.plan ?? null;
  }

  async checkout(plan: string, userId: string) {
    if (process.env.MIDTRANS_MOCK_MODE === 'true') {
      return this.activateMockStarter(userId);
    }

    const price = PLAN_PRICES[plan];
    const orderId = `SUB-${Date.now()}-${userId.slice(-8)}`;
    const planInfo = PLAN_DISPLAY[plan];

    const transaction = await this.snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: price },
      item_details: [
        {
          id: plan,
          name: `Jastip Platform - ${planInfo.displayName} (30 hari)`,
          price,
          quantity: 1,
        },
      ],
    });

    await this.supabase.client.from('subscriptions').insert({
      user_id: userId,
      plan,
      status: 'pending',
      midtrans_order_id: orderId,
      midtrans_token: transaction.token,
    });

    return { token: transaction.token, redirectUrl: transaction.redirect_url };
  }

  private async activateMockStarter(userId: string) {
    await this.supabase.client
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.supabase.client.from('subscriptions').insert({
      user_id: userId,
      plan: 'starter',
      status: 'active',
      expires_at: expiresAt.toISOString(),
    });

    return { token: 'mock-activated', redirectUrl: '' };
  }

  async handleWebhook(payload: any) {
    const { order_id, transaction_status, fraud_status, gross_amount, status_code } = payload;

    if (!order_id?.startsWith('SUB-')) return { received: true };

    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
    const expectedSignature = createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (!payload.signature_key || payload.signature_key !== expectedSignature) {
      return { received: false };
    }

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      const { data: sub } = await this.supabase.client
        .from('subscriptions')
        .select('user_id')
        .eq('midtrans_order_id', order_id)
        .single();

      if (sub) {
        await this.supabase.client
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', sub.user_id)
          .eq('status', 'active');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.supabase.client
          .from('subscriptions')
          .update({ status: 'active', expires_at: expiresAt.toISOString() })
          .eq('midtrans_order_id', order_id);
      }
    } else if (transaction_status === 'expire' || transaction_status === 'cancel') {
      await this.supabase.client
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('midtrans_order_id', order_id);
    }

    return { received: true };
  }

  async checkStoreLimit(userId: string): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) {
      throw new HttpException(
        'Langganan aktif diperlukan untuk membuat toko',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const limits = PLAN_LIMITS[plan];
    if (limits.maxStores === null) return;

    const count = await this.getOwnedStoreCount(userId);
    if (count >= limits.maxStores) {
      throw new HttpException(
        `Paket ${PLAN_DISPLAY[plan].displayName} hanya mendukung ${limits.maxStores} toko`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async checkProductLimit(storeId: string): Promise<void> {
    const ownerId = await this.getStoreOwner(storeId);
    if (!ownerId) return;

    const plan = await this.getActivePlan(ownerId);
    if (!plan) return;

    const limits = PLAN_LIMITS[plan];
    if (limits.maxProductsPerStore === null) return;

    const { count } = await this.supabase.client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if ((count ?? 0) >= limits.maxProductsPerStore) {
      throw new HttpException(
        `Paket ${PLAN_DISPLAY[plan].displayName} hanya mendukung ${limits.maxProductsPerStore} produk per toko`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async checkFeatureAccess(userId: string, feature: keyof PlanLimits): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) {
      throw new HttpException(
        'Langganan aktif diperlukan untuk menggunakan fitur ini',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const limits = PLAN_LIMITS[plan];
    if (!limits[feature]) {
      throw new HttpException(
        `Fitur ini tidak tersedia di paket ${PLAN_DISPLAY[plan].displayName}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async checkMemberLimit(storeId: string): Promise<void> {
    const ownerId = await this.getStoreOwner(storeId);
    if (!ownerId) return;

    const plan = await this.getActivePlan(ownerId);
    if (!plan) return;

    const limits = PLAN_LIMITS[plan];
    if (limits.maxMembersPerStore === null) return;

    const { count } = await this.supabase.client
      .from('store_members')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if ((count ?? 0) >= limits.maxMembersPerStore) {
      const maxTeam = limits.maxMembersPerStore - 1;
      throw new HttpException(
        `Paket ${PLAN_DISPLAY[plan].displayName} hanya mendukung ${maxTeam} anggota tim tambahan`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async checkPermanentLinkLimit(userId: string, storeId: string): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) {
      throw new HttpException(
        'Langganan aktif diperlukan untuk membuat link permanen',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const limits = PLAN_LIMITS[plan];
    if (limits.maxPermanentOrderLinks === 0) {
      throw new HttpException(
        `Paket ${PLAN_DISPLAY[plan].displayName} tidak mendukung link permanen`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    if (limits.maxPermanentOrderLinks === null) return;

    const { count } = await this.supabase.client
      .from('order_links')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_permanent', true);

    if ((count ?? 0) >= limits.maxPermanentOrderLinks) {
      throw new HttpException(
        `Paket ${PLAN_DISPLAY[plan].displayName} hanya mendukung ${limits.maxPermanentOrderLinks} link permanen`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async storeHasCategorization(storeId: string): Promise<boolean> {
    const ownerId = await this.getStoreOwner(storeId);
    if (!ownerId) return false;
    const plan = await this.getActivePlan(ownerId);
    if (!plan) return false;
    return PLAN_LIMITS[plan].hasCategorization;
  }

  private async getStoreOwner(storeId: string): Promise<string | null> {
    const { data } = await this.supabase.client
      .from('store_members')
      .select('user_id')
      .eq('store_id', storeId)
      .eq('role', 'owner')
      .single();
    return data?.user_id ?? null;
  }

  private async getOwnedStoreCount(userId: string): Promise<number> {
    const { count } = await this.supabase.client
      .from('store_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'owner');
    return count ?? 0;
  }
}
