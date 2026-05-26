import { Injectable, NotFoundException } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { SupabaseService } from '../common/supabase/supabase.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  private readonly clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async getMyStores(userId: string) {
    // Resolve pending invites (user_id IS NULL) that match this user's email,
    // covering the case where the invite was created before the user signed up.
    try {
      const clerkUser = await this.clerk.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        await this.supabase.client
          .from('store_members')
          .update({ user_id: userId })
          .eq('email', email)
          .is('user_id', null)
          .eq('invitation_status', 'accepted');
      }
    } catch {
      // non-fatal — pending invites remain unresolved until next load
    }

    const { data, error } = await this.supabase.client
      .from('store_members')
      .select('role, stores(id, name, logo_url), store_id')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    const memberCountMap = await this.getMemberCounts(
      data.map((r: any) => r.store_id),
    );

    return data.map((r: any) => ({
      storeId: r.store_id,
      storeName: r.stores?.name,
      storePhotoUrl: r.stores?.logo_url,
      role: r.role,
      memberCount: memberCountMap[r.store_id] ?? 0,
    }));
  }

  async getMyRole(storeId: string, userId: string) {
    const { data, error } = await this.supabase.client
      .from('store_members')
      .select('role, stores(name)')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Membership not found');
    return { role: data.role, storeName: (data as any).stores?.name ?? '' };
  }

  async getPublicInfo(storeId: string) {
    const { data, error } = await this.supabase.client
      .from('stores')
      .select('name, logo_url')
      .eq('id', storeId)
      .single();

    if (error || !data) return null;
    return { storeName: (data as any).name, storePhotoUrl: (data as any).logo_url };
  }

  async create(dto: CreateStoreDto, userId: string) {
    await this.subscriptions.checkStoreLimit(userId);

    const clerkUser = await this.clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

    const { data: store, error: storeErr } = await this.supabase.client
      .from('stores')
      .insert({ name: dto.name, logo_url: dto.storePhotoUrl })
      .select()
      .single();

    if (storeErr) throw new Error(storeErr.message);

    const { error: memberErr } = await this.supabase.client
      .from('store_members')
      .insert({ store_id: (store as any).id, user_id: userId, email, role: 'owner' });

    if (memberErr) throw new Error(memberErr.message);

    const { error: settingsErr } = await this.supabase.client
      .from('settings')
      .insert({ store_id: (store as any).id });

    if (settingsErr) throw new Error(settingsErr.message);

    return {
      storeId: (store as any).id,
      storeName: (store as any).name,
      storePhotoUrl: (store as any).logo_url,
      role: 'owner' as const,
      memberCount: 1,
    };
  }

  async getUserRole(storeId: string, userId: string): Promise<string | null> {
    const { data } = await this.supabase.client
      .from('store_members')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .single();
    return data?.role ?? null;
  }

  async getStoreIdForUser(userId: string): Promise<string | null> {
    const { data } = await this.supabase.client
      .from('store_members')
      .select('store_id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    return data?.store_id ?? null;
  }

  private async getMemberCounts(storeIds: string[]): Promise<Record<string, number>> {
    if (!storeIds.length) return {};
    const { data } = await this.supabase.client
      .from('store_members')
      .select('store_id')
      .in('store_id', storeIds);

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.store_id] = (counts[row.store_id] ?? 0) + 1;
    }
    return counts;
  }
}
