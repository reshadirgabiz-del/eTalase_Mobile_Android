import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresService } from '../stores/stores.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateOrderLinkDto } from './dto/create-order-link.dto';

const EXPIRY_HOURS = 2;

@Injectable()
export class OrderLinksService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stores: StoresService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async create(dto: CreateOrderLinkDto, userId: string, storeId: string) {
    const role = await this.stores.getUserRole(storeId, userId);
    if (!role || role === 'delivery') throw new ForbiddenException();

    await this.subscriptions.checkFeatureAccess(userId, 'hasOrderLinks');

    if (dto.message) {
      await this.subscriptions.checkFeatureAccess(userId, 'hasOrderLinkMessage');
    }

    if (dto.isPermanent) {
      await this.subscriptions.checkPermanentLinkLimit(userId, storeId);
    }

    const expiresAt = dto.isPermanent
      ? null
      : new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase.client
      .from('order_links')
      .insert({
        store_id: storeId,
        items: dto.items,
        expires_at: expiresAt,
        is_permanent: dto.isPermanent ?? false,
        message: dto.message ?? null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPublic(id: string) {
    const { data, error } = await this.supabase.client
      .from('order_links')
      .select('id, store_id, items, expires_at, is_permanent, message, created_at')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Link tidak ditemukan');

    if (!data.is_permanent && new Date(data.expires_at) < new Date()) {
      throw new HttpException('Link ini sudah kadaluarsa', HttpStatus.GONE);
    }

    const productIds = (data.items as any[]).map((i) => i.productId);
    const { data: products } = await this.supabase.client
      .from('products')
      .select('id, name, price, image_url, stock')
      .in('id', productIds)
      .eq('store_id', data.store_id);

    const productMap = Object.fromEntries(
      (products ?? []).map((p: any) => [p.id, p]),
    );

    const itemsWithDetails = (data.items as any[]).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: productMap[item.productId] ?? null,
    }));

    return { ...data, items: itemsWithDetails };
  }

  async list(userId: string, storeId: string) {
    if (!(await this.stores.getUserRole(storeId, userId))) throw new ForbiddenException();

    const { data, error } = await this.supabase.client
      .from('order_links')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string, userId: string, storeId: string) {
    const role = await this.stores.getUserRole(storeId, userId);
    if (!role || role === 'delivery') throw new ForbiddenException();

    const { error, count } = await this.supabase.client
      .from('order_links')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw new Error(error.message);
    if (!count) throw new NotFoundException('Link tidak ditemukan');
    return { success: true };
  }
}
