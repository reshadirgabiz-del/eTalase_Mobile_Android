import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import axios from 'axios';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresService } from '../stores/stores.service';
import { UploadService } from '../upload/upload.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

type SocialLink = { platform: string; url: string };

type SettingsRow = {
  store_name: string;
  store_description: string;
  logo_url: string;
  midtrans_server_key: string;
  midtrans_client_key: string;
  origin_address: string;
  origin_city: string;
  origin_province: string;
  origin_postal_code: string;
  enabled_couriers: string[];
  bank_transfer_enabled: boolean;
  bank_transfer_text: string;
  bank_account_number: string;
  bank_recipient_name: string;
  bank_name: string;
  currency: string;
  flat_rate_delivery_enabled: boolean;
  flat_rate_delivery_price: number;
  flat_rate_delivery_name: string | null;
  social_links: SocialLink[];
};

function toDto(row: SettingsRow) {
  return {
    storeName: row.store_name ?? '',
    storeDescription: row.store_description ?? '',
    logoUrl: row.logo_url ?? '',
    midtransServerKey: row.midtrans_server_key ?? '',
    midtransClientKey: row.midtrans_client_key ?? '',
    originAddress: row.origin_address ?? '',
    originCity: row.origin_city ?? '',
    originProvince: row.origin_province ?? '',
    originPostalCode: row.origin_postal_code ?? '',
    enabledCouriers: row.enabled_couriers ?? [],
    bankTransferEnabled: row.bank_transfer_enabled ?? false,
    bankTransferText: row.bank_transfer_text ?? '',
    bankAccountNumber: row.bank_account_number ?? '',
    bankRecipientName: row.bank_recipient_name ?? '',
    bankName: row.bank_name ?? '',
    currency: row.currency ?? 'IDR',
    flatRateDeliveryEnabled: row.flat_rate_delivery_enabled ?? false,
    flatRateDeliveryPrice: row.flat_rate_delivery_price ?? 0,
    flatRateDeliveryName: row.flat_rate_delivery_name ?? '',
    socialLinks: row.social_links ?? [],
  };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stores: StoresService,
    private readonly upload: UploadService,
  ) {}

  async get(userId: string, storeId: string) {
    if (!(await this.stores.getUserRole(storeId, userId)))
      throw new ForbiddenException();

    const { data, error } = await this.supabase.client
      .from('settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error || !data) throw new NotFoundException('Settings not found');
    return toDto(data as SettingsRow);
  }

  /** Public endpoint — returns fields safe for unauthenticated callers. */
  async getPublic(storeId: string) {
    const { data, error } = await this.supabase.client
      .from('settings')
      .select(
        'store_name, store_description, logo_url, origin_address, ' +
          'bank_transfer_enabled, bank_transfer_text, bank_account_number, bank_recipient_name, bank_name, ' +
          'currency, flat_rate_delivery_enabled, flat_rate_delivery_price, flat_rate_delivery_name, social_links',
      )
      .eq('store_id', storeId)
      .single();

    if (error || !data) return null;
    const row = data as any;
    return {
      storeName: row.store_name ?? '',
      storeDescription: row.store_description ?? '',
      logoUrl: row.logo_url ?? '',
      originAddress: row.origin_address ?? '',
      bankTransferEnabled: row.bank_transfer_enabled ?? false,
      bankTransferText: row.bank_transfer_text ?? '',
      bankAccountNumber: row.bank_account_number ?? '',
      bankRecipientName: row.bank_recipient_name ?? '',
      bankName: row.bank_name ?? '',
      currency: row.currency ?? 'IDR',
      flatRateDeliveryEnabled: row.flat_rate_delivery_enabled ?? false,
      flatRateDeliveryPrice: row.flat_rate_delivery_price ?? 0,
      flatRateDeliveryName: row.flat_rate_delivery_name ?? '',
      socialLinks: (row.social_links ?? []) as SocialLink[],
    };
  }

  async update(dto: UpdateSettingsDto, userId: string, storeId: string) {
    const role = await this.stores.getUserRole(storeId, userId);
    if (role !== 'owner') throw new ForbiddenException();

    let oldLogoUrl: string | undefined;
    if (dto.logoUrl !== undefined) {
      const { data: current } = await this.supabase.client
        .from('settings')
        .select('logo_url')
        .eq('store_id', storeId)
        .single();
      oldLogoUrl = current?.logo_url ?? undefined;
    }

    // When the origin location changes, look up and cache the Biteship area ID
    // Use city + province for a more precise Biteship area match
    let originAreaId: string | undefined;
    const lookupChanged = dto.originCity !== undefined || dto.originProvince !== undefined || dto.originAddress !== undefined;
    if (lookupChanged) {
      try {
        const { data: current } = await this.supabase.client
          .from('settings')
          .select('origin_city, origin_province, origin_address')
          .eq('store_id', storeId)
          .single();
        const city = dto.originCity ?? (current as any)?.origin_city ?? '';
        const province = dto.originProvince ?? (current as any)?.origin_province ?? '';
        const street = dto.originAddress ?? (current as any)?.origin_address ?? '';
        const searchText = [city, province].filter(Boolean).join(', ') || street;
        if (searchText) {
          const res = await axios.get(
            `${process.env.BITESHIP_API_URL}/maps/areas`,
            {
              params: { input: searchText, type: 'single', country_code: 'ID' },
              headers: { Authorization: `Bearer ${process.env.BITESHIP_API_KEY}` },
            },
          );
          const areas: { id: string }[] = res.data?.areas ?? [];
          if (areas.length) originAreaId = areas[0].id;
        }
      } catch {
        // Non-fatal: will be resolved on next delivery estimate
      }
    }

    const { data, error } = await this.supabase.client
      .from('settings')
      .update({
        ...(dto.storeName !== undefined && { store_name: dto.storeName }),
        ...(dto.storeDescription !== undefined && {
          store_description: dto.storeDescription,
        }),
        ...(dto.logoUrl !== undefined && { logo_url: dto.logoUrl }),
        ...(dto.midtransServerKey !== undefined && {
          midtrans_server_key: dto.midtransServerKey,
        }),
        ...(dto.midtransClientKey !== undefined && {
          midtrans_client_key: dto.midtransClientKey,
        }),
        ...(dto.originAddress !== undefined && { origin_address: dto.originAddress }),
        ...(dto.originCity !== undefined && { origin_city: dto.originCity }),
        ...(dto.originProvince !== undefined && { origin_province: dto.originProvince }),
        ...(dto.originPostalCode !== undefined && { origin_postal_code: dto.originPostalCode }),
        ...(originAreaId !== undefined && { origin_area_id: originAreaId }),
        ...(dto.enabledCouriers !== undefined && {
          enabled_couriers: dto.enabledCouriers,
        }),
        ...(dto.bankTransferEnabled !== undefined && {
          bank_transfer_enabled: dto.bankTransferEnabled,
        }),
        ...(dto.bankTransferText !== undefined && {
          bank_transfer_text: dto.bankTransferText,
        }),
        ...(dto.bankAccountNumber !== undefined && {
          bank_account_number: dto.bankAccountNumber,
        }),
        ...(dto.bankRecipientName !== undefined && {
          bank_recipient_name: dto.bankRecipientName,
        }),
        ...(dto.bankName !== undefined && { bank_name: dto.bankName }),
        // New fields
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.flatRateDeliveryEnabled !== undefined && {
          flat_rate_delivery_enabled: dto.flatRateDeliveryEnabled,
        }),
        ...(dto.flatRateDeliveryPrice !== undefined && {
          flat_rate_delivery_price: dto.flatRateDeliveryPrice,
        }),
        ...(dto.flatRateDeliveryName !== undefined && {
          flat_rate_delivery_name: dto.flatRateDeliveryName,
        }),
        ...(dto.socialLinks !== undefined && {
          social_links: dto.socialLinks,
        }),
      })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (oldLogoUrl && oldLogoUrl !== dto.logoUrl) {
      this.upload.deleteByUrl(oldLogoUrl);
    }

    // Keep stores table in sync so GET /stores/my reflects current name/logo
    const storesPatch: Record<string, string> = {};
    if (dto.storeName !== undefined) storesPatch.name = dto.storeName;
    if (dto.logoUrl !== undefined) storesPatch.logo_url = dto.logoUrl;
    if (Object.keys(storesPatch).length) {
      await this.supabase.client
        .from('stores')
        .update(storesPatch)
        .eq('id', storeId);
    }

    return toDto(data as SettingsRow);
  }
}
