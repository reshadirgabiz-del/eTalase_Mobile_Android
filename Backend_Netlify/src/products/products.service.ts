import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresService } from '../stores/stores.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

function serializeProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: row.price,
    imageUrl: row.image_url ?? '',
    stock: row.stock ?? 0,
    tags: row.tags ?? [],
    isActive: row.is_active ?? false,
    weightGrams: row.weight_grams ?? 500,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stores: StoresService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async listActive(storeId: string, page: number, limit: number) {
    const from = (page - 1) * limit;
    const { data, count, error } = await this.supabase.client
      .from('products')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);

    const hasCategorization = await this.subscriptions.storeHasCategorization(storeId);
    const products = (data ?? []).map((p: any) =>
      serializeProduct({ ...p, tags: hasCategorization ? (p.tags ?? []) : [] }),
    );

    return { data: products, total: count, page, limit };
  }

  async listAll(userId: string, storeId: string, page: number, limit: number) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const from = (page - 1) * limit;
    const { data, count, error } = await this.supabase.client
      .from('products')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('name', { ascending: true })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data: (data ?? []).map(serializeProduct), total: count, page, limit };
  }

  async getOne(id: string) {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Product not found');
    return serializeProduct(data);
  }

  async create(dto: CreateProductDto, userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    await this.subscriptions.checkProductLimit(storeId);
    const tags = (dto.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean);
    const { data, error } = await this.supabase.client
      .from('products')
      .insert({
        store_id: storeId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image_url: dto.imageUrl,
        stock: dto.stock,
        tags,
        is_active: dto.isActive,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return serializeProduct(data);
  }

  async update(id: string, dto: UpdateProductDto, userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const { data, error } = await this.supabase.client
      .from('products')
      .update({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.tags !== undefined && { tags: dto.tags.map((t) => t.toLowerCase().trim()).filter(Boolean) }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      })
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Product not found');
    return serializeProduct(data);
  }

  async remove(id: string, userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    const { error } = await this.supabase.client
      .from('products')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw new NotFoundException('Product not found');
    return { success: true };
  }

  getImportTemplate(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      ['nama_produk', 'deskripsi', 'harga', 'stok', 'tags', 'aktif'],
      ['Contoh Produk', 'Deskripsi singkat', 150000, 10, 'tag1,tag2', 'ya'],
    ]);
    ws['!cols'] = [{ wch: 24 }, { wch: 32 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async importProducts(
    fileBuffer: Buffer,
    userId: string,
    storeId: string,
  ): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();
    await this.subscriptions.checkFeatureAccess(userId, 'hasProductImport');

    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const name = String(row['nama_produk'] ?? '').trim();
      const price = Number(row['harga']);
      const stock = Number(row['stok']);
      const description = String(row['deskripsi'] ?? '').trim();
      const tagsRaw = String(row['tags'] ?? '').trim();
      const isActiveRaw = String(row['aktif'] ?? 'ya').toLowerCase().trim();

      if (!name) { errors.push({ row: rowNum, message: 'nama_produk wajib diisi' }); continue; }
      if (isNaN(price) || price < 0) { errors.push({ row: rowNum, message: 'harga tidak valid' }); continue; }
      if (isNaN(stock) || stock < 0) { errors.push({ row: rowNum, message: 'stok tidak valid' }); continue; }

      const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.toLowerCase().trim()).filter(Boolean) : [];
      const isActive = ['ya', 'yes', 'true', '1'].includes(isActiveRaw);

      try {
        await this.subscriptions.checkProductLimit(storeId);
        await this.supabase.client.from('products').insert({
          store_id: storeId,
          name,
          description,
          price,
          stock,
          tags,
          is_active: isActive,
          image_url: null,
        });
        imported++;
      } catch (err: any) {
        errors.push({ row: rowNum, message: err.message ?? 'Gagal menyimpan produk' });
      }
    }

    return { imported, errors };
  }
}
