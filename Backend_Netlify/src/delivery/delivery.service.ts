import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { SupabaseService } from '../common/supabase/supabase.service';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';

@Injectable()
export class DeliveryService {
  constructor(private readonly supabase: SupabaseService) {}

  private async lookupAreaId(query: string): Promise<string> {
    const res = await axios.get(`${process.env.BITESHIP_API_URL}/maps/areas`, {
      params: { input: query, type: 'single', country_code: 'ID' },
      headers: { Authorization: `Bearer ${process.env.BITESHIP_API_KEY}` },
    });
    const areas: { id: string }[] = res.data?.areas ?? [];
    if (!areas.length)
      throw new BadRequestException(`Lokasi tidak ditemukan: ${query}`);
    return areas[0].id;
  }

  async estimate(dto: DeliveryEstimateDto) {
    const { data: settings, error } = await this.supabase.client
      .from('settings')
      .select(
        'origin_address, origin_city, origin_province, origin_area_id, ' +
          'flat_rate_delivery_enabled, flat_rate_delivery_price, flat_rate_delivery_name',
      )
      .eq('store_id', dto.storeId)
      .single();

    if (error || !settings)
      throw new NotFoundException('Store settings not found');

    const flatRateEnabled =
      (settings as any).flat_rate_delivery_enabled ?? false;
    const flatRatePrice = (settings as any).flat_rate_delivery_price ?? 0;
    const flatRateName =
      (settings as any).flat_rate_delivery_name || 'Pengiriman Flat Rate';

    const flatRateOption = flatRateEnabled
      ? {
          courierId: 'flat_rate',
          courierName: flatRateName,
          courierCode: 'flat_rate',
          serviceName: 'Flat Rate',
          serviceType: 'flat_rate',
          price: flatRatePrice,
          estimatedDays: '1-3',
        }
      : null;

    // If origin is not configured, only return flat-rate (if available)
    const s = settings as any;
    const originConfigured = s.origin_city || s.origin_province || s.origin_address;
    if (!originConfigured) {
      if (flatRateOption) return [flatRateOption];
      throw new NotFoundException('Alamat asal toko belum dikonfigurasi');
    }

    // Use cached origin area ID or resolve it and cache for next time
    let originAreaId: string = s.origin_area_id ?? '';
    if (!originAreaId) {
      const lookupText = [s.origin_city, s.origin_province].filter(Boolean).join(', ') || s.origin_address;
      originAreaId = await this.lookupAreaId(lookupText);
      await this.supabase.client
        .from('settings')
        .update({ origin_area_id: originAreaId })
        .eq('store_id', dto.storeId);
    }

    const destinationAreaId = await this.lookupAreaId(dto.destinationAddress);

    let courierOptions: any[] = [];
    try {
      const response = await axios.post(
        `${process.env.BITESHIP_API_URL}/rates/couriers`,
        {
          origin_area_id: originAreaId,
          destination_area_id: destinationAreaId,
          couriers: 'jne,sicepat,jnt',
          items: [
            {
              name: 'Package',
              value: 10000,
              weight: dto.totalWeightGrams,
              quantity: 1,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${process.env.BITESHIP_API_KEY}` },
        },
      );
      courierOptions = (response.data.pricing ?? []).map((rate: any) => ({
        courierId: rate.courier_code,
        courierName: rate.courier_name,
        courierCode: rate.courier_code,
        serviceName: rate.courier_service_name,
        serviceType: rate.type,
        price: rate.price,
        estimatedDays: rate.shipment_duration_range,
      }));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const biteshipMsg =
          err.response?.data?.error ??
          err.response?.data?.message ??
          JSON.stringify(err.response?.data ?? err.message);
        console.error(
          '[Biteship rates error]',
          err.response?.status,
          biteshipMsg,
        );
        // If flat-rate is available, return it even when Biteship fails
        if (flatRateOption) return [flatRateOption];
        throw new InternalServerErrorException(`Biteship: ${biteshipMsg}`);
      }
      throw err;
    }

    // Prepend flat-rate option if enabled
    return flatRateOption
      ? [flatRateOption, ...courierOptions]
      : courierOptions;
  }
}
