import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Snap } from 'midtrans-client';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresService } from '../stores/stores.service';
import { CreateOrderDto, AddAttachmentDto } from './dto/create-order.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['cancelled'],
  cancelled: [],
};

function serializeOrder(row: any) {
  return {
    id: row.id,
    status: row.status,
    isArchived: row.is_archived ?? false,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_price,
    total: row.total,
    trackingNumber: row.tracking_number ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    address: {
      recipientName: row.recipient_name,
      phone: row.phone,
      street: row.street,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      notes: row.notes ?? undefined,
    },
    deliveryOption: {
      courierId: row.courier_id,
      courierName: row.courier_name,
      courierCode: row.courier_code,
      serviceName: row.service_name,
      serviceType: row.service_type,
      price: row.delivery_price,
      estimatedDays: String(row.estimated_days ?? ''),
    },
    items: (row.order_items ?? []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      price: i.price,
      quantity: i.quantity,
    })),
    attachments: (row.order_attachments ?? []).map((a: any) => ({
      id: a.id,
      filename: a.file_name,
      size: a.size ?? 0,
      uploadedBy: a.uploaded_by ?? '',
      uploadedAt: a.created_at ?? '',
      url: a.signedUrl ?? a.file_path ?? null,
    })),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stores: StoresService,
  ) {}

  async create(dto: CreateOrderDto) {
    // Fetch store-specific Midtrans keys — each store uses its own account
    const { data: storeSettings } = await this.supabase.client
      .from('settings')
      .select('midtrans_server_key, midtrans_client_key')
      .eq('store_id', dto.storeId)
      .single();

    if (!storeSettings?.midtrans_server_key || !storeSettings?.midtrans_client_key) {
      throw new BadRequestException(
        'Midtrans belum dikonfigurasi untuk toko ini. Hubungi pemilik toko.',
      );
    }

    const snap = new Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: storeSettings.midtrans_server_key,
      clientKey: storeSettings.midtrans_client_key,
    });

    const productIds = dto.items.map((i) => i.productId);
    const { data: products, error: pErr } = await this.supabase.client
      .from('products')
      .select('id, name, price')
      .in('id', productIds)
      .eq('store_id', dto.storeId);

    if (pErr) throw new Error(pErr.message);

    const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]));
    const itemDetails = dto.items.map((item) => {
      const product = productMap[item.productId];
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      return {
        id: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const subtotal = itemDetails.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = subtotal + dto.deliveryOption.price;

    const { data: order, error: oErr } = await this.supabase.client
      .from('orders')
      .insert({
        store_id: dto.storeId,
        status: 'pending',
        subtotal,
        delivery_price: dto.deliveryOption.price,
        total,
        recipient_name: dto.address.recipientName,
        phone: dto.address.phone,
        street: dto.address.street,
        city: dto.address.city,
        province: dto.address.province,
        postal_code: dto.address.postalCode,
        notes: dto.address.notes,
        courier_id: dto.deliveryOption.courierId,
        courier_name: dto.deliveryOption.courierName,
        courier_code: dto.deliveryOption.courierCode,
        service_name: dto.deliveryOption.serviceName,
        service_type: dto.deliveryOption.serviceType,
        estimated_days: dto.deliveryOption.estimatedDays,
      })
      .select()
      .single();

    if (oErr) throw new Error(oErr.message);

    const { error: itemsErr } = await this.supabase.client.from('order_items').insert(
      itemDetails.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    );

    if (itemsErr) {
      await this.supabase.client.from('orders').delete().eq('id', order.id);
      throw new Error(itemsErr.message);
    }

    let transaction: { token: string; redirect_url: string };
    try {
      transaction = await snap.createTransaction({
        transaction_details: { order_id: order.id, gross_amount: total },
        customer_details: {
          first_name: dto.address.recipientName,
          phone: dto.address.phone,
          shipping_address: {
            address: dto.address.street,
            city: dto.address.city,
            postal_code: dto.address.postalCode,
          },
        },
        item_details: itemDetails.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    } catch (err) {
      await this.supabase.client.from('orders').delete().eq('id', order.id);
      throw err;
    }

    await this.supabase.client
      .from('orders')
      .update({
        midtrans_token: transaction.token,
        midtrans_redirect_url: transaction.redirect_url,
      })
      .eq('id', order.id);

    return { ...serializeOrder(order), midtransToken: transaction.token, midtransRedirectUrl: transaction.redirect_url };
  }

  async list(userId: string, storeId: string, page: number, limit: number, status?: string, archived?: boolean) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const from = (page - 1) * limit;
    let query = this.supabase.client
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('is_archived', archived ?? false)
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query.range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data ?? []).map(serializeOrder), total: count, page, limit };
  }

  async archive(id: string, userId: string, storeId: string) {
    const role = await this.stores.getUserRole(storeId, userId);
    if (!role || role === 'delivery') throw new ForbiddenException();
    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Order not found');
    return serializeOrder(data);
  }

  async unarchive(id: string, userId: string, storeId: string) {
    const role = await this.stores.getUserRole(storeId, userId);
    if (!role || role === 'delivery') throw new ForbiddenException();
    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ is_archived: false })
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Order not found');
    return serializeOrder(data);
  }

  async getOne(id: string, userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*), order_attachments(*)')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (error || !data) throw new NotFoundException('Order not found');
    const attachments = await this.signAttachments((data as any).order_attachments ?? []);
    return serializeOrder({ ...data, order_attachments: attachments });
  }

  async updateStatus(id: string, newStatus: string, userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('status')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (error || !order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`,
      );
    }

    const { data, error: uErr } = await this.supabase.client
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single();

    if (uErr) throw new Error(uErr.message);
    return serializeOrder(data);
  }

  async addAttachment(id: string, dto: AddAttachmentDto, userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const { data: order } = await this.supabase.client
      .from('orders')
      .select('id')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (!order) throw new NotFoundException('Order not found');

    const { error } = await this.supabase.client
      .from('order_attachments')
      .insert({
        order_id: id,
        file_name: dto.filename,
        file_path: dto.url ?? '',
        mime_type: 'application/octet-stream',
      });

    if (error) throw new Error(error.message);

    const { data: updated, error: fetchErr } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*), order_attachments(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !updated) throw new NotFoundException('Order not found');
    const attachments = await this.signAttachments((updated as any).order_attachments ?? []);
    return serializeOrder({ ...updated, order_attachments: attachments });
  }

  private async signAttachments(attachments: any[]): Promise<any[]> {
    return Promise.all(
      attachments.map(async (a) => {
        const { data } = await this.supabase.client.storage
          .from('order-attachments')
          .createSignedUrl(a.file_path, 3600);
        return { ...a, signedUrl: data?.signedUrl ?? null };
      }),
    );
  }
}
