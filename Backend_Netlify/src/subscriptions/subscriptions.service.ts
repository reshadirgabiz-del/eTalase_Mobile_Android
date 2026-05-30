import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { Snap } from 'midtrans-client';
import { SupabaseService } from '../common/supabase/supabase.service';
import { PLAN_LIMITS, PLAN_PRICES, PLAN_DISPLAY, type PlanLimits, type PlanDisplay } from './plans.constants';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private snap: Snap;
  private planLimitsCache: Record<string, PlanLimits> = { ...PLAN_LIMITS };
  private planDisplayCache: Record<string, PlanDisplay> = { ...PLAN_DISPLAY };

  constructor(private readonly supabase: SupabaseService) {
    this.snap = new Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  async onModuleInit() {
    await this.refreshFromDb();
  }

  async refreshFromDb() {
    const { data } = await this.supabase.client
      .from('plan_configs')
      .select('plan_key, config');
    if (!data?.length) return;

    for (const row of data) {
      const base = PLAN_LIMITS[row.plan_key];
      const baseDisplay = PLAN_DISPLAY[row.plan_key];
      if (!base) continue;
      const merged = { ...base, ...row.config };
      this.planLimitsCache[row.plan_key] = merged;
      if (baseDisplay) {
        this.planDisplayCache[row.plan_key] = {
          ...baseDisplay,
          limits: merged,
          ...(row.config.priceIdr !== undefined ? { priceIdr: row.config.priceIdr, effectivePriceIdr: row.config.priceIdr } : {}),
          ...(row.config.displayName !== undefined ? { displayName: row.config.displayName } : {}),
          ...(row.config.description !== undefined ? { description: row.config.description } : {}),
          ...(row.config.features !== undefined ? { features: row.config.features } : {}),
        };
      }
    }
  }

  private getLimits(plan: string): PlanLimits {
    return this.planLimitsCache[plan] ?? PLAN_LIMITS[plan];
  }

  private getDisplay(plan: string): PlanDisplay {
    return this.planDisplayCache[plan] ?? PLAN_DISPLAY[plan];
  }

  getPlans() {
    return Object.keys(PLAN_DISPLAY).map((k) => this.getDisplay(k));
  }

  async getPlanAdminConfig() {
    const { data } = await this.supabase.client
      .from('plan_configs')
      .select('plan_key, config, updated_at');

    const dbMap: Record<string, any> = {};
    for (const row of data ?? []) dbMap[row.plan_key] = row.config;

    return Object.keys(PLAN_DISPLAY).map((key) => ({
      key,
      static: { ...PLAN_LIMITS[key], ...PLAN_DISPLAY[key] },
      overrides: dbMap[key] ?? null,
      effective: this.getLimits(key),
      displayName: this.getDisplay(key).displayName,
      priceIdr: this.getDisplay(key).priceIdr,
      description: this.getDisplay(key).description,
      features: this.getDisplay(key).features,
      recommended: this.getDisplay(key).recommended,
    }));
  }

  async updatePlanConfig(key: string, updates: Partial<PlanLimits & { priceIdr: number; features: string[]; description: string }>) {
    if (!PLAN_DISPLAY[key]) {
      throw new HttpException('Plan tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const { data: existing } = await this.supabase.client
      .from('plan_configs')
      .select('config')
      .eq('plan_key', key)
      .maybeSingle();

    const merged = { ...(existing?.config ?? {}), ...updates };

    await this.supabase.client
      .from('plan_configs')
      .upsert({ plan_key: key, config: merged, updated_at: new Date().toISOString() }, { onConflict: 'plan_key' });

    await this.refreshFromDb();
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

    const plan = this.getDisplay(data.plan);
    const limits = this.getLimits(data.plan);
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

  async validateVoucher(code: string): Promise<{ code: string; discountType: string; discountValue: number }> {
    const { data: voucher } = await this.supabase.client
      .from('plan_vouchers')
      .select('*')
      .ilike('code', code.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!voucher) throw new HttpException('Kode voucher tidak valid', HttpStatus.BAD_REQUEST);
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) throw new HttpException('Kode voucher sudah kedaluwarsa', HttpStatus.BAD_REQUEST);
    if (voucher.max_usages !== null && voucher.current_usages >= voucher.max_usages) throw new HttpException('Kode voucher sudah habis digunakan', HttpStatus.BAD_REQUEST);

    return { code: voucher.code, discountType: voucher.discount_type, discountValue: Number(voucher.discount_value) };
  }

  async checkout(plan: string, userId: string, voucherCode?: string) {
    if (process.env.MIDTRANS_MOCK_MODE === 'true') {
      return this.activateMockStarter(userId);
    }

    const planEntry = this.getDisplay(plan);
    if (!planEntry) throw new HttpException('Plan tidak valid', HttpStatus.BAD_REQUEST);

    const basePrice = planEntry.priceIdr ?? 0;
    let finalPrice = basePrice;
    let voucherId: string | null = null;

    if (voucherCode?.trim()) {
      const { data: voucher } = await this.supabase.client
        .from('plan_vouchers')
        .select('*')
        .ilike('code', voucherCode.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (!voucher) throw new HttpException('Kode voucher tidak valid', HttpStatus.BAD_REQUEST);
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) throw new HttpException('Kode voucher sudah kedaluwarsa', HttpStatus.BAD_REQUEST);
      if (voucher.max_usages !== null && voucher.current_usages >= voucher.max_usages) throw new HttpException('Kode voucher sudah habis digunakan', HttpStatus.BAD_REQUEST);

      voucherId = voucher.id;
      const discountValue = Number(voucher.discount_value);
      if (voucher.discount_type === 'percent') {
        finalPrice = Math.round(finalPrice * (1 - discountValue / 100));
      } else {
        finalPrice = Math.max(0, finalPrice - discountValue);
      }

      await this.supabase.client
        .from('plan_vouchers')
        .update({ current_usages: voucher.current_usages + 1 })
        .eq('id', voucherId);
    }

    // Free plan or fully-discounted price — activate directly
    if (finalPrice === 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await this.supabase.client.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');
      await this.supabase.client.from('subscriptions').insert({ user_id: userId, plan, status: 'active', expires_at: expiresAt.toISOString() });
      return { token: 'mock-activated', redirectUrl: '' };
    }

    const orderId = `SUB-${Date.now()}-${userId.slice(-8)}`;

    const transaction = await this.snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: finalPrice },
      item_details: [{ id: plan, name: `Jastip Platform - ${planEntry.displayName} (30 hari)`, price: finalPrice, quantity: 1 }],
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
    await this.supabase.client.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.supabase.client.from('subscriptions').insert({ user_id: userId, plan: 'starter', status: 'active', expires_at: expiresAt.toISOString() });
    return { token: 'mock-activated', redirectUrl: '' };
  }

  async handleWebhook(payload: any) {
    const { order_id, transaction_status, fraud_status, gross_amount, status_code } = payload;

    if (!order_id?.startsWith('SUB-')) return { received: true };

    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
    const expectedSignature = createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (!payload.signature_key || payload.signature_key !== expectedSignature) return { received: false };

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      const { data: sub } = await this.supabase.client.from('subscriptions').select('user_id').eq('midtrans_order_id', order_id).single();
      if (sub) {
        await this.supabase.client.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', sub.user_id).eq('status', 'active');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const amountPaid = gross_amount ? parseInt(String(gross_amount), 10) || null : null;
        await this.supabase.client.from('subscriptions').update({ status: 'active', expires_at: expiresAt.toISOString(), amount_paid: amountPaid }).eq('midtrans_order_id', order_id);
      }
    } else if (transaction_status === 'expire' || transaction_status === 'cancel') {
      await this.supabase.client.from('subscriptions').update({ status: 'cancelled' }).eq('midtrans_order_id', order_id);
    }

    return { received: true };
  }

  async cancelStalePendingSubscriptions(): Promise<{ cancelled: number }> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    const { data } = await this.supabase.client
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('status', 'pending')
      .lt('created_at', cutoff.toISOString())
      .select('id');
    return { cancelled: data?.length ?? 0 };
  }

  async checkStoreLimit(userId: string): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) throw new HttpException('Langganan aktif diperlukan untuk membuat toko', HttpStatus.PAYMENT_REQUIRED);

    const limits = this.getLimits(plan);
    if (limits.maxStores === null) return;
    const count = await this.getOwnedStoreCount(userId);
    if (count >= limits.maxStores) {
      throw new HttpException(`Paket ${this.getDisplay(plan).displayName} hanya mendukung ${limits.maxStores} toko`, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async checkProductLimit(storeId: string): Promise<void> {
    const ownerId = await this.getStoreOwner(storeId);
    if (!ownerId) return;
    const plan = await this.getActivePlan(ownerId);
    if (!plan) return;

    const limits = this.getLimits(plan);
    if (limits.maxProductsPerStore === null) return;

    const { count } = await this.supabase.client.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId);
    if ((count ?? 0) >= limits.maxProductsPerStore) {
      throw new HttpException(`Paket ${this.getDisplay(plan).displayName} hanya mendukung ${limits.maxProductsPerStore} produk per toko`, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async checkFeatureAccess(userId: string, feature: keyof PlanLimits): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) throw new HttpException('Langganan aktif diperlukan untuk menggunakan fitur ini', HttpStatus.PAYMENT_REQUIRED);
    const limits = this.getLimits(plan);
    if (!limits[feature]) throw new HttpException(`Fitur ini tidak tersedia di paket ${this.getDisplay(plan).displayName}`, HttpStatus.PAYMENT_REQUIRED);
  }

  async checkMemberLimit(storeId: string): Promise<void> {
    const ownerId = await this.getStoreOwner(storeId);
    if (!ownerId) return;
    const plan = await this.getActivePlan(ownerId);
    if (!plan) return;

    const limits = this.getLimits(plan);
    if (limits.maxMembersPerStore === null) return;

    const { count } = await this.supabase.client.from('store_members').select('*', { count: 'exact', head: true }).eq('store_id', storeId);
    if ((count ?? 0) >= limits.maxMembersPerStore) {
      throw new HttpException(`Paket ${this.getDisplay(plan).displayName} hanya mendukung ${limits.maxMembersPerStore - 1} anggota tim tambahan`, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async checkPermanentLinkLimit(userId: string, storeId: string): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) throw new HttpException('Langganan aktif diperlukan untuk membuat link permanen', HttpStatus.PAYMENT_REQUIRED);

    const limits = this.getLimits(plan);
    if (limits.maxPermanentOrderLinks === 0) throw new HttpException(`Paket ${this.getDisplay(plan).displayName} tidak mendukung link permanen`, HttpStatus.PAYMENT_REQUIRED);
    if (limits.maxPermanentOrderLinks === null) return;

    const { count } = await this.supabase.client.from('order_links').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_permanent', true);
    if ((count ?? 0) >= limits.maxPermanentOrderLinks) {
      throw new HttpException(`Paket ${this.getDisplay(plan).displayName} hanya mendukung ${limits.maxPermanentOrderLinks} link permanen`, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async checkTemporaryLinkLimit(userId: string, storeId: string): Promise<void> {
    const plan = await this.getActivePlan(userId);
    if (!plan) return;

    const limits = this.getLimits(plan);
    if (limits.maxTemporaryOrderLinks === null) return;

    const now = new Date().toISOString();
    const { count } = await this.supabase.client
      .from('order_links')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_permanent', false)
      .gt('expires_at', now);

    if ((count ?? 0) >= limits.maxTemporaryOrderLinks) {
      throw new HttpException(`Paket ${this.getDisplay(plan).displayName} hanya mendukung ${limits.maxTemporaryOrderLinks} link sementara aktif`, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async storeHasCategorization(storeId: string): Promise<boolean> {
    const ownerId = await this.getStoreOwner(storeId);
    if (!ownerId) return false;
    const plan = await this.getActivePlan(ownerId);
    if (!plan) return false;
    return this.getLimits(plan).hasCategorization;
  }

  private async getStoreOwner(storeId: string): Promise<string | null> {
    const { data } = await this.supabase.client.from('store_members').select('user_id').eq('store_id', storeId).eq('role', 'owner').single();
    return data?.user_id ?? null;
  }

  private async getOwnedStoreCount(userId: string): Promise<number> {
    const { count } = await this.supabase.client.from('store_members').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'owner');
    return count ?? 0;
  }
}
