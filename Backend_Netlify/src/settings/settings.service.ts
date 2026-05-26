import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresService } from '../stores/stores.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stores: StoresService,
  ) {}

  async get(userId: string, storeId: string) {
    if (!await this.stores.getUserRole(storeId, userId)) throw new ForbiddenException();

    const { data, error } = await this.supabase.client
      .from('settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error || !data) throw new NotFoundException('Settings not found');
    return data;
  }

  async update(dto: UpdateSettingsDto, userId: string, storeId: string) {
    const role = await this.stores.getUserRole(storeId, userId);
    if (role !== 'owner') throw new ForbiddenException();

    const { data, error } = await this.supabase.client
      .from('settings')
      .update({
        ...(dto.storeName !== undefined && { store_name: dto.storeName }),
        ...(dto.storeDescription !== undefined && { store_description: dto.storeDescription }),
        ...(dto.logoUrl !== undefined && { logo_url: dto.logoUrl }),
        ...(dto.midtransServerKey !== undefined && { midtrans_server_key: dto.midtransServerKey }),
        ...(dto.midtransClientKey !== undefined && { midtrans_client_key: dto.midtransClientKey }),
        ...(dto.originAddress !== undefined && { origin_address: dto.originAddress }),
        ...(dto.originLat !== undefined && { origin_lat: dto.originLat }),
        ...(dto.originLng !== undefined && { origin_lng: dto.originLng }),
        ...(dto.enabledCouriers !== undefined && { enabled_couriers: dto.enabledCouriers }),
      })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Keep stores table in sync so GET /stores/my reflects current name/logo
    const storesPatch: Record<string, string> = {};
    if (dto.storeName !== undefined) storesPatch.name = dto.storeName;
    if (dto.logoUrl !== undefined) storesPatch.logo_url = dto.logoUrl;
    if (Object.keys(storesPatch).length) {
      await this.supabase.client.from('stores').update(storesPatch).eq('id', storeId);
    }

    return data;
  }
}
